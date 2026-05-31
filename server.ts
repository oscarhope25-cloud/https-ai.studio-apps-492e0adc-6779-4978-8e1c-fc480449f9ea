import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for base64 if needed
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(process.cwd(), 'database.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure local storage via Multer
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, `${uniqueSuffix}-${cleanedName}`);
  }
});
const upload = multer({ storage: storageConfig });

// Initialize optional GCS client dynamically
let gcsStorage: Storage | null = null;
const bucketName = process.env.GCS_BUCKET_NAME;
if (bucketName) {
  try {
    gcsStorage = new Storage();
    console.log(`Google Cloud Storage enabled with bucket: ${bucketName}`);
  } catch (err) {
    console.warn('GCS client initialization failed. Local storage fallback will be used:', err);
  }
}

// Load database logic
interface DbSchema {
  books: any[];
  videos: any[];
}

function loadDatabase(): DbSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading database file, returning empty list:', e);
    }
  }
  return { books: [], videos: [] };
}

function saveDatabase(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing to database.json:', e);
  }
}

// --- API ENDPOINTS ---

// GET books catalogue
app.get('/api/books', (req, res) => {
  const db = loadDatabase();
  res.json(db.books);
});

// SAVE books list (or sync changed books)
app.post('/api/books', (req, res) => {
  const updatedBooks = req.body;
  if (!Array.isArray(updatedBooks)) {
    return res.status(400).json({ error: 'Body must be an array of books' });
  }
  const db = loadDatabase();
  db.books = updatedBooks;
  saveDatabase(db);
  res.json({ success: true, count: db.books.length });
});

// GET videos catalogue
app.get('/api/videos', (req, res) => {
  const db = loadDatabase();
  res.json(db.videos);
});

// SAVE videos list (or sync changed videos)
app.post('/api/videos', (req, res) => {
  const updatedVideos = req.body;
  if (!Array.isArray(updatedVideos)) {
    return res.status(400).json({ error: 'Body must be an array of videos' });
  }
  const db = loadDatabase();
  db.videos = updatedVideos;
  saveDatabase(db);
  res.json({ success: true, count: db.videos.length });
});

// POST reset server database to standard demo structures
app.post('/api/reset', (req, res) => {
  const { books, videos } = req.body;
  const db = { books: books || [], videos: videos || [] };
  saveDatabase(db);
  res.json({ success: true, message: 'Database reset successfully' });
});

// FILE UPLOAD endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const localFilePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const filename = req.file.filename;

    // If GCS is configured, upload to Google Cloud Storage
    if (gcsStorage && bucketName) {
      try {
        const bucket = gcsStorage.bucket(bucketName);
        const destination = `archives/${Date.now()}-${filename}`;
        
        console.log(`Uploading file ${originalName} to GCS bucket ${bucketName} as ${destination}...`);
        
        try {
          await bucket.upload(localFilePath, {
            destination: destination,
            metadata: {
              contentType: mimeType,
            },
            public: true, // Make uploaded files publicly readable
          });
        } catch (aclErr: any) {
          console.warn(`GCS public ACL upload failed (likely Uniform Bucket-Level Access). Retrying without ACLs... Info: ${aclErr?.message || aclErr}`);
          // Retry without ACL settings
          await bucket.upload(localFilePath, {
            destination: destination,
            metadata: {
              contentType: mimeType,
            },
          });
        }

        // Delete the temporary local file
        fs.unlinkSync(localFilePath);

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
        console.log(`Upload complete. Public GCS URL: ${publicUrl}`);
        return res.json({ 
          url: publicUrl, 
          filename: originalName,
          storageType: 'gcs'
        });
      } catch (gcsErr: any) {
        console.warn('Google Cloud Storage upload skipped or failed, falling back to local container media storage. Info:', gcsErr?.message || gcsErr);
        // Fall back to serving local container path
      }
    }

    // Local serving fallback URL
    const publicUrl = `/uploads/${filename}`;
    console.log(`Serving file locally: ${publicUrl}`);
    res.json({ 
      url: publicUrl, 
      filename: originalName,
      storageType: 'local_fallback'
    });
  } catch (err: any) {
    console.error('Upload processor exception:', err);
    res.status(500).json({ error: err?.message || 'Server error occurred during upload file streams.' });
  }
});

// --- VITE DEV MIDDLEWARE & SPA FALLBACKS ---
async function mountVite() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    app.use(vite.middlewares);

    // Fallback HTML serving for SPA in development
    app.get('*', async (req, res, next) => {
      // Skip API and uploads routes
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }

      try {
        const url = req.originalUrl;
        const indexHtmlPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          // Apply Vite HTML transforms (injects HMR script, plugin styles/scripts, etc.)
          template = await vite.transformIndexHtml(url, template);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
    console.log('Vite development middleware mounted successfully with custom SPA fallback.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Exclude API and uploads
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static files mounted from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server executing at http://0.0.0.0:${PORT}`);
  });
}

mountVite();
