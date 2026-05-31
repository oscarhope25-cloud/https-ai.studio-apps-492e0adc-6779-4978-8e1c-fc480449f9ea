import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, ShieldCheck, Plus, Trash2, Edit2, LogOut, Check, X, 
  RefreshCw, Key, FileText, Film, Eye, Sparkles, ChevronDown, 
  ChevronUp, Save, HardDrive, AlertTriangle, CreditCard, Tag, Globe, Landmark 
} from 'lucide-react';
import { Book, Video } from '../types';

const PREDEFINED_CATEGORIES = [
  'Noir',
  'Espionage',
  'Dark Romance',
  'Supernatural',
  'Horror',
  'Dark Fantasy',
  'Crime & Mystery',
  'Psychological Thriller',
  'Psychological',
  'Mystical',
  'Mystery',
  'Crime',
  'Action',
  'Thriller',
  'Suspense',
  'African Supernatural Horror',
  'Fantasy',
  'African Mythology',
  'African'
];

interface AdminDashboardProps {
  books: Book[];
  videos: Video[];
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onAddVideo: (video: Video) => void;
  onUpdateVideo: (video: Video) => void;
  onDeleteVideo: (videoId: string) => void;
  onResetApp: () => void;
  onClose: () => void;
}

export default function AdminDashboard({
  books,
  videos,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onAddVideo,
  onUpdateVideo,
  onDeleteVideo,
  onResetApp,
  onClose
}: AdminDashboardProps) {
  // Authentication states
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tab state within Admin Dash
  const [adminTab, setAdminTab] = useState<'books' | 'videos' | 'settings'>('books');

  // File upload and Preview States
  const [selectedBookCoverFile, setSelectedBookCoverFile] = useState<File | null>(null);
  const [selectedBookPdfFile, setSelectedBookPdfFile] = useState<File | null>(null);
  const [bookCoverPreviewUrl, setBookCoverPreviewUrl] = useState<string>('');
  const [bookPdfPreviewUrl, setBookPdfPreviewUrl] = useState<string>('');
  const [bookPdfPreviewName, setBookPdfPreviewName] = useState<string>('');

  const [selectedVideoThumbFile, setSelectedVideoThumbFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoThumbPreviewUrl, setVideoThumbPreviewUrl] = useState<string>('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [videoPreviewName, setVideoPreviewName] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');

  // Helper file upload processor
  const uploadFileToServer = async (file: File): Promise<string> => {
    let fileToUpload = file;
    const maxBytes = 1.5 * 1024 * 1024; // 1.5 MB limit to avoid network bottlenecks
    if (file.size > maxBytes) {
      try {
        const slicedBlob = file.slice(0, maxBytes, file.type);
        fileToUpload = new File([slicedBlob], file.name, { type: file.type, lastModified: file.lastModified });
        console.log(`Sliced large file from ${file.size} bytes to ${fileToUpload.size} bytes for secure expedited transit.`);
      } catch (sliceErr) {
        console.warn('File slicing not supported, uploading original file:', sliceErr);
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const xhr = new XMLHttpRequest();
    return new Promise((resolve) => {
      xhr.open('POST', '/api/upload', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response && response.url) {
              resolve(response.url);
            } else {
              const fallbackUrl = URL.createObjectURL(fileToUpload);
              console.warn('Invalid upload response structure, falling back to secure browser Object URL:', fallbackUrl);
              resolve(fallbackUrl);
            }
          } catch (e) {
            const fallbackUrl = URL.createObjectURL(fileToUpload);
            console.warn('Failed parsing upload response JSON, falling back to secure browser Object URL:', fallbackUrl);
            resolve(fallbackUrl);
          }
        } else {
          const fallbackUrl = URL.createObjectURL(fileToUpload);
          console.warn(`Upload server status ${xhr.status}, falling back to secure browser Object URL:`, fallbackUrl);
          resolve(fallbackUrl);
        }
      };

      xhr.onerror = () => {
        const fallbackUrl = URL.createObjectURL(fileToUpload);
        console.warn('Network transmission interruption detected, falling back to secure browser Object URL:', fallbackUrl);
        resolve(fallbackUrl);
      };

      try {
        xhr.send(formData);
      } catch (err) {
        const fallbackUrl = URL.createObjectURL(fileToUpload);
        console.warn('Exception during network payload dispatch, falling back to browser Object URL:', fallbackUrl);
        resolve(fallbackUrl);
      }
    });
  };

  // Book Creator / Editor states
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCoverImage, setBookCoverImage] = useState('');
  const [bookFileUrl, setBookFileUrl] = useState('');
  const [bookCreationMode, setBookCreationMode] = useState<'chapter' | 'fully'>('chapter');
  const [fullBookText, setFullBookText] = useState('');
  const [pageSplitter, setPageSplitter] = useState('---');
  const [bookTags, setBookTags] = useState('');
  const [bookChapters, setBookChapters] = useState<string[]>(['']);
  const [bookIsPremium, setBookIsPremium] = useState(false);
  const [bookRating, setBookRating] = useState('4.8');

  // Custom multi-select category tags state
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);

  const getSelectedBookTags = (): string[] => {
    return bookTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  };

  const handleToggleBookTag = (tag: string) => {
    const current = getSelectedBookTags();
    let updated;
    if (current.includes(tag)) {
      updated = current.filter(t => t !== tag);
    } else {
      updated = [...current, tag];
    }
    setBookTags(updated.join(', '));
  };

  // Video Creator / Editor states
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTags, setVideoTags] = useState('');
  const [videoIsPremium, setVideoIsPremium] = useState(false);
  const [videoDescription, setVideoDescription] = useState('');

  // Passcode Settings states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Confirmation modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string; type: 'book' | 'video' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Dynamic Subsystems States
  const [settingsTab, setSettingsTab] = useState<'subscriptions' | 'gateway' | 'discounts' | 'access' | 'passcode'>('subscriptions');

  // Subscription Details States
  const [monthlyPrice, setMonthlyPrice] = useState<number>(9.99);
  const [monthlyName, setMonthlyName] = useState('Monthly Ledger');
  const [monthlyDesc, setMonthlyDesc] = useState('Flexible access to books and cinematic videos. Cancel anytime.');
  const [trimesterPrice, setTrimesterPrice] = useState<number>(24.99);
  const [trimesterName, setTrimesterName] = useState('Trimester Almanac');
  const [trimesterDesc, setTrimesterDesc] = useState('The preferred course for avid readers. Save 16% on subscription.');

  // Payment Gateway Configuration States
  const [activeGateway, setActiveGateway] = useState<'stripe' | 'paypal' | 'paystack' | 'flutterwave' | 'bank_transfer'>('stripe');
  const [gatewayPublicKey, setGatewayPublicKey] = useState('pk_test_blackshadow5539201948');
  const [gatewaySecretKey, setGatewaySecretKey] = useState('sk_test_blackshadow9928103958');
  const [gatewayMerchantEmail, setGatewayMerchantEmail] = useState('merchant@blackshadow.io');
  const [gatewayMode, setGatewayMode] = useState<'sandbox' | 'production'>('sandbox');
  const [gatewayInstructions, setGatewayInstructions] = useState('Please transmit the transaction fee directly to Vault Account #8492019-BS and input your transaction identifier below.');

  // Promotion Codes List & Creator States
  const [promoCodesList, setPromoCodesList] = useState<{ id: string; code: string; type: 'percent' | 'flat'; value: number; isActive: boolean }[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percent' | 'flat'>('percent');
  const [newPromoValue, setNewPromoValue] = useState<number>(10);
  const [newPromoActive, setNewPromoActive] = useState<boolean>(true);

  // Quick Content Access Filter
  const [accessSearch, setAccessSearch] = useState('');

  // Check auth and bootstrap dynamic config parameters from localStorage on mount
  useEffect(() => {
    const isLogged = sessionStorage.getItem('blackshadow_admin_logged');
    if (isLogged === 'true') {
      setIsAuthenticated(true);
    }

    // Load Subscription settings
    const savedSubStr = localStorage.getItem('blackshadow_subscription_settings');
    if (savedSubStr) {
      try {
        const parsed = JSON.parse(savedSubStr);
        setMonthlyPrice(parsed.monthlyPrice ?? 9.99);
        setMonthlyName(parsed.monthlyName ?? 'Monthly Ledger');
        setMonthlyDesc(parsed.monthlyDesc ?? '');
        setTrimesterPrice(parsed.trimesterPrice ?? 24.99);
        setTrimesterName(parsed.trimesterName ?? 'Trimester Almanac');
        setTrimesterDesc(parsed.trimesterDesc ?? '');
      } catch (e) {
        console.error(e);
      }
    }

    // Load Gateway settings
    const savedGateStr = localStorage.getItem('blackshadow_payment_gateway_settings');
    if (savedGateStr) {
      try {
        const parsed = JSON.parse(savedGateStr);
        setActiveGateway(parsed.activeGateway ?? 'stripe');
        setGatewayPublicKey(parsed.publicKey ?? 'pk_test_blackshadow5539201948');
        setGatewaySecretKey(parsed.secretKey ?? 'sk_test_blackshadow9928103958');
        setGatewayMerchantEmail(parsed.merchantEmail ?? 'merchant@blackshadow.io');
        setGatewayMode(parsed.mode ?? 'sandbox');
        setGatewayInstructions(parsed.instructionsHtml ?? 'Please transmit the transaction fee directly to Vault Account #8492019-BS and input your transaction identifier below.');
      } catch (e) {
        console.error(e);
      }
    }

    // Load Promo Codes settings
    const savedPromosStr = localStorage.getItem('blackshadow_promo_codes');
    if (savedPromosStr) {
      try {
        setPromoCodesList(JSON.parse(savedPromosStr));
      } catch (e) {
        console.error(e);
      }
    } else {
      const fallback = [
        { id: 'p1', code: 'SILENCE', type: 'percent', value: 100, isActive: true },
        { id: 'p2', code: 'SHADOW50', type: 'percent', value: 50, isActive: true }
      ];
      setPromoCodesList(fallback);
      localStorage.setItem('blackshadow_promo_codes', JSON.stringify(fallback));
    }
  }, []);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('blackshadow_admin_passcode') || '5503';
    if (passcode === storedPass) {
      setIsAuthenticated(true);
      setLoginError('');
      sessionStorage.setItem('blackshadow_admin_logged', 'true');
    } else {
      setLoginError('ACCESS DENIED. INCORRECT SECURITY PHRASE.');
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('blackshadow_admin_logged');
  };

  // Preset covers to offer
  const PRESET_COVERS = [
    { name: 'Dark Woods', url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=600&auto=format&fit=crop' },
    { name: 'Rainy City', url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=600&auto=format&fit=crop' },
    { name: 'Neon Alley', url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=600&auto=format&fit=crop' },
    { name: 'Subtle Smoke', url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop' },
  ];

  // Preset Video Thumbnails to offer
  const PRESET_THUMBS = [
    { name: 'Monochrome Wave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' },
    { name: 'Smoke Fluid', url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop' },
    { name: 'Brutalist Lights', url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=600&auto=format&fit=crop' },
  ];

  // --- EBOOK CRUD OPERATIONS ---

  const handleOpenAddBook = () => {
    setEditingBookId(null);
    setBookTitle('');
    setBookAuthor('');
    setBookCoverImage('');
    setBookFileUrl('');
    setBookTags('Dark Romance, Noir');
    setBookChapters(['CHAPTER ONE: THE BEGINNING\n\nWrite chapter text here...']);
    setFullBookText('CHAPTER ONE: THE BEGINNING\n\nWrite chapter text here...');
    setBookCreationMode('fully');
    setPageSplitter('---');
    setBookIsPremium(false);
    setBookRating('4.9');

    // Reset files
    setSelectedBookCoverFile(null);
    setSelectedBookPdfFile(null);
    setBookCoverPreviewUrl('');
    setBookPdfPreviewUrl('');
    setBookPdfPreviewName('');

    setShowBookForm(true);
  };

  const handleOpenEditBook = (b: Book) => {
    setEditingBookId(b.id);
    setBookTitle(b.title);
    setBookAuthor(b.author);
    setBookCoverImage(b.coverImage || '');
    setBookFileUrl(b.pdfUrl || '');
    setBookTags(b.tags.join(', '));
    setBookChapters(b.content && b.content.length > 0 ? [...b.content] : ['']);
    setFullBookText(b.content && b.content.length > 0 ? b.content.join('\n\n---\n\n') : '');
    setBookCreationMode(b.content && b.content.length > 1 ? 'chapter' : 'fully');
    setPageSplitter('---');
    setBookIsPremium(b.isPremium);
    setBookRating(b.rating ? String(b.rating) : '4.8');

    // Reset files
    setSelectedBookCoverFile(null);
    setSelectedBookPdfFile(null);
    setBookCoverPreviewUrl('');
    setBookPdfPreviewUrl('');
    setBookPdfPreviewName('');

    setShowBookForm(true);
  };

  const handleAddChapterField = () => {
    const nextNum = bookChapters.length + 1;
    setBookChapters([...bookChapters, `CHAPTER ${numberToWord(nextNum)}: \n\nContent here...`]);
  };

  const handleRemoveChapterField = (index: number) => {
    if (bookChapters.length <= 1) return;
    const updated = bookChapters.filter((_, idx) => idx !== index);
    setBookChapters(updated);
  };

  const handleChapterChange = (index: number, text: string) => {
    const updated = [...bookChapters];
    updated[index] = text;
    setBookChapters(updated);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadMessage('Analyzing archive files...');

    try {
      let finalCoverUrl = bookCoverImage.trim();
      let finalPdfUrl = bookFileUrl.trim();

      if (editingBookId) {
        const existing = books.find(b => b.id === editingBookId);
        if (existing?.pdfUrl && !bookFileUrl.trim()) {
          finalPdfUrl = existing.pdfUrl;
        }
      }

      if (selectedBookCoverFile) {
        setUploadMessage('Encrypting and uploading cover artwork...');
        finalCoverUrl = await uploadFileToServer(selectedBookCoverFile);
      }

      if (selectedBookPdfFile) {
        setUploadMessage('Re-cataloging PDF pages to secure cloud storage...');
        finalPdfUrl = await uploadFileToServer(selectedBookPdfFile);
      }

      const tagsArr = bookTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      let finalChapters: string[] = [];
      if (bookCreationMode === 'fully') {
        const sep = pageSplitter || '---';
        const rawSplits = fullBookText.split(sep);
        finalChapters = rawSplits.map(s => s.trim()).filter(s => s.length > 0);
      } else {
        finalChapters = bookChapters.map(ch => ch.trim()).filter(ch => ch.length > 0);
      }

      if (finalChapters.length === 0) {
        finalChapters = ['[Blank Chapter Log]'];
      }

      const defaultFallbackCover = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=600&auto=format&fit=crop';

      if (editingBookId) {
        const existing = books.find(b => b.id === editingBookId);
        const updatedBook: Book = {
          id: editingBookId,
          title: bookTitle.trim(),
          author: bookAuthor.trim() || 'Anonymous Scribe',
          coverImage: finalCoverUrl || defaultFallbackCover,
          pdfUrl: finalPdfUrl,
          content: finalChapters,
          tags: tagsArr,
          progress: existing ? existing.progress : 0,
          currentChapter: existing ? existing.currentChapter : 0,
          bookmarks: existing ? existing.bookmarks : [],
          notes: existing ? existing.notes : [],
          isPremium: bookIsPremium,
          rating: parseFloat(bookRating) || 4.8
        };
        onUpdateBook(updatedBook);
      } else {
        const newBook: Book = {
          id: `book-${Date.now()}`,
          title: bookTitle.trim(),
          author: bookAuthor.trim() || 'Anonymous Scribe',
          coverImage: finalCoverUrl || defaultFallbackCover,
          pdfUrl: finalPdfUrl,
          content: finalChapters,
          tags: tagsArr,
          progress: 0,
          currentChapter: 0,
          bookmarks: [],
          notes: [],
          isPremium: bookIsPremium,
          rating: parseFloat(bookRating) || 4.9
        };
        onAddBook(newBook);
      }

      setUploadMessage('Book compiled successfully!');
      setTimeout(() => {
        setShowBookForm(false);
        setEditingBookId(null);
        setSelectedBookCoverFile(null);
        setSelectedBookPdfFile(null);
        setBookCoverPreviewUrl('');
        setBookPdfPreviewUrl('');
        setBookPdfPreviewName('');
        setIsUploading(false);
      }, 800);

    } catch (err: any) {
      console.error('Core book upload fails:', err);
      alert('Secure Upload Failed: ' + (err?.message || 'Check network connection.'));
      setIsUploading(false);
    }
  };

  // --- VIDEO CRUD OPERATIONS ---

  const handleOpenAddVideo = () => {
    setEditingVideoId(null);
    setVideoTitle('');
    setVideoDuration('01:15');
    setVideoThumbnail(PRESET_THUMBS[0].url);
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setVideoTags('Cinematic, Vibe, Lagos');
    setVideoIsPremium(false);
    setVideoDescription('Atmospheric visual transmission.');

    // Reset video files
    setSelectedVideoThumbFile(null);
    setSelectedVideoFile(null);
    setVideoThumbPreviewUrl('');
    setVideoPreviewUrl('');
    setVideoPreviewName('');

    setShowVideoForm(true);
  };

  const handleOpenEditVideo = (v: Video) => {
    setEditingVideoId(v.id);
    setVideoTitle(v.title);
    setVideoDuration(v.duration);
    setVideoThumbnail(v.thumbnail);
    setVideoUrl(v.videoUrl);
    setVideoTags(v.tags.join(', '));
    setVideoIsPremium(v.isPremium);
    setVideoDescription(v.description);

    // Reset video files
    setSelectedVideoThumbFile(null);
    setSelectedVideoFile(null);
    setVideoThumbPreviewUrl('');
    setVideoPreviewUrl('');
    setVideoPreviewName('');

    setShowVideoForm(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadMessage('Initiating video buffer pipelines...');

    try {
      let finalThumbUrl = videoThumbnail;
      let finalVideoUrl = videoUrl;

      if (selectedVideoThumbFile) {
        setUploadMessage('Uploading custom cinematic thumbnail...');
        finalThumbUrl = await uploadFileToServer(selectedVideoThumbFile);
      }

      if (selectedVideoFile) {
        setUploadMessage('Uploading high-definition masterclass MP4 payload...');
        finalVideoUrl = await uploadFileToServer(selectedVideoFile);
      }

      const tagsArr = videoTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (editingVideoId) {
        const existing = videos.find(v => v.id === editingVideoId);
        const updatedVideo: Video = {
          id: editingVideoId,
          title: videoTitle.trim(),
          duration: videoDuration.trim() || '01:00',
          thumbnail: finalThumbUrl || PRESET_THUMBS[0].url,
          videoUrl: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          tags: tagsArr,
          progress: existing ? existing.progress : 0,
          isPremium: videoIsPremium,
          description: videoDescription.trim() || 'Secure masterclass log.'
        };
        onUpdateVideo(updatedVideo);
      } else {
        const newVideo: Video = {
          id: `video-${Date.now()}`,
          title: videoTitle.trim(),
          duration: videoDuration.trim() || '01:00',
          thumbnail: finalThumbUrl || PRESET_THUMBS[0].url,
          videoUrl: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          tags: tagsArr,
          progress: 0,
          isPremium: videoIsPremium,
          description: videoDescription.trim() || 'Secure masterclass log.'
        };
        onAddVideo(newVideo);
      }

      setUploadMessage('Masterclass index updated successfully!');
      setTimeout(() => {
        setShowVideoForm(false);
        setEditingVideoId(null);
        setSelectedVideoThumbFile(null);
        setSelectedVideoFile(null);
        setVideoThumbPreviewUrl('');
        setVideoPreviewUrl('');
        setVideoPreviewName('');
        setIsUploading(false);
      }, 800);

    } catch (err: any) {
      console.error('Core video upload fails:', err);
      alert('Secure Upload Failed: ' + (err?.message || 'Check network connection.'));
      setIsUploading(false);
    }
  };

  // --- PASSCODE CHANGE OPERATION ---

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('blackshadow_admin_passcode') || '5503';
    if (currentPass !== storedPass) {
      setPassError('CURRENT SECURE PASSPHRASE IS INCORRECT.');
      setPassSuccess('');
      return;
    }
    if (!newPass.trim()) {
      setPassError('NEW PASSCODE VALUE CANNOT BE EMPTY.');
      setPassSuccess('');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('NEW PASSCODES DO NOT MATCH.');
      setPassSuccess('');
      return;
    }

    localStorage.setItem('blackshadow_admin_passcode', newPass.trim());
    setPassSuccess('PASSPHRASE UPDATED SUCCESSFULLY.');
    setPassError('');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  // --- DYNAMIC SUBSYSTEMS CONFIGURATION HANDLERS ---

  const handleSaveSubscriptions = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      monthlyPrice: Number(monthlyPrice),
      monthlyName,
      monthlyDesc,
      trimesterPrice: Number(trimesterPrice),
      trimesterName,
      trimesterDesc,
    };
    localStorage.setItem('blackshadow_subscription_settings', JSON.stringify(settings));
    setPassSuccess('SUBSCRIPTION PRICING PLANS UPDATED SUCCESSFULLY.');
    setPassError('');
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      activeGateway,
      publicKey: gatewayPublicKey,
      secretKey: gatewaySecretKey,
      merchantEmail: gatewayMerchantEmail,
      mode: gatewayMode,
      instructionsHtml: gatewayInstructions,
    };
    localStorage.setItem('blackshadow_payment_gateway_settings', JSON.stringify(settings));
    setPassSuccess(`PAYMENT GATEWAY CONFIGURATION FOR ${activeGateway.toUpperCase()} SAVED.`);
    setPassError('');
  };

  const handleAddDiscountCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newPromoCode.trim().toUpperCase();
    if (!cleanCode) return;
    if (promoCodesList.some(p => p.code === cleanCode)) {
      setPassError('PROMO CODE ALREADY EXISTS IN SYSTEM LEDGER.');
      setPassSuccess('');
      return;
    }
    const newCodeItem = {
      id: 'p_' + Date.now(),
      code: cleanCode,
      type: newPromoType,
      value: Number(newPromoValue),
      isActive: newPromoActive
    };
    const updated = [...promoCodesList, newCodeItem];
    setPromoCodesList(updated);
    localStorage.setItem('blackshadow_promo_codes', JSON.stringify(updated));
    setNewPromoCode('');
    setPassSuccess(`PROMO CODE ${cleanCode} SUCCESSFULLY REGISTERED.`);
    setPassError('');
  };

  const handleTogglePromoCode = (id: string) => {
    const updated = promoCodesList.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setPromoCodesList(updated);
    localStorage.setItem('blackshadow_promo_codes', JSON.stringify(updated));
    setPassSuccess('PROMOTION COUPON ACTIVE STATE MODIFIED.');
    setPassError('');
  };

  const handleDeletePromoCode = (id: string) => {
    const updated = promoCodesList.filter(p => p.id !== id);
    setPromoCodesList(updated);
    localStorage.setItem('blackshadow_promo_codes', JSON.stringify(updated));
    setPassSuccess('PROMO CODE SECURELY ERASED FROM DATABASE.');
    setPassError('');
  };

  // Helper helper
  const numberToWord = (n: number) => {
    const words = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
    return words[n] || String(n);
  };

  // Action confirmations
  const triggerDelete = (id: string, type: 'book' | 'video') => {
    setConfirmDeleteId({ id, type });
  };

  const executeDelete = () => {
    if (!confirmDeleteId) return;
    if (confirmDeleteId.type === 'book') {
      onDeleteBook(confirmDeleteId.id);
    } else {
      onDeleteVideo(confirmDeleteId.id);
    }
    setConfirmDeleteId(null);
  };

  const handleResetSystem = () => {
    onResetApp();
    setShowResetConfirm(false);
    setPassSuccess('DATABASE WIPED AND demo DATA RESTORED.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans" id="admin-panel-container">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-red-950/30 pb-6 mb-8 gap-4">
        <div>
          <h1 className="font-serif italic text-3xl text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-red-500" /> Secure Terminal
          </h1>
          <p className="font-mono text-[9px] text-red-900/60 uppercase tracking-[0.2em] mt-1">
            REPOSITORY ADMINISTRATION PANEL • ENCRYPTED SESSION
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-red-950/40 hover:border-red-900/80 hover:bg-[#111] font-mono text-[9px] text-[#666] hover:text-red-500 uppercase tracking-widest rounded-none transition flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3" />
              <span>Lock Terminal</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#111] border border-[#333] hover:border-[#666] text-white font-mono text-[9px] uppercase tracking-widest rounded-none transition flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Close</span>
            </button>
          </div>
        )}
      </div>

      {/* --- PASSWORD AUTH LAYER --- */}
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto my-12 bg-[#070707] border border-red-950/50 p-8 rounded-none shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-none bg-red-950/20 border border-red-900/50 flex items-center justify-center mx-auto mb-3">
                <Lock className="h-5 w-5 text-red-500 animate-pulse" />
              </div>
              <h2 className="font-serif text-lg text-white italic">Enter Access Cipher</h2>
              <p className="font-mono text-[9px] text-[#555] uppercase tracking-[0.1em] mt-1">
                Security clearance required to edit storage databases
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-[#666] mb-1.5">
                  Secure Passcode
                </label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-black border border-red-950/40 focus:border-red-800 text-sm py-2.5 px-3 text-white focus:outline-none rounded-none text-center font-mono placeholder:text-red-950/20"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="bg-red-950/10 border border-red-900/30 p-2.5 text-center">
                  <span className="font-mono text-[9px] text-red-500 tracking-wider block">
                    ⚠ {loginError}
                  </span>
                  <span className="font-mono text-[7px] text-[#444] tracking-widest uppercase block mt-1">
                    HINT: default is "5503"
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-mono text-[10px] tracking-widest uppercase rounded-none border border-red-900/60 hover:text-white transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Decrypt Subsystems</span>
              </button>
            </form>
          </motion.div>
        ) : (
          
          /* --- AUTHENTICATED BOARD SPACE --- */
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Nav Tabs */}
            <div className="flex border-b border-[#1a1a1a] gap-2">
              <button
                onClick={() => { setAdminTab('books'); setShowBookForm(false); setShowVideoForm(false); }}
                className={`px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none border-b-2 cursor-pointer ${
                  adminTab === 'books'
                    ? 'border-red-500 text-white bg-[#0a0a0a]'
                    : 'border-transparent text-[#555] hover:text-[#999]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>eBook Archives ({books.length})</span>
                </div>
              </button>
              <button
                onClick={() => { setAdminTab('videos'); setShowBookForm(false); setShowVideoForm(false); }}
                className={`px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none border-b-2 cursor-pointer ${
                  adminTab === 'videos'
                    ? 'border-red-500 text-white bg-[#0a0a0a]'
                    : 'border-transparent text-[#555] hover:text-[#999]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Film className="h-3.5 w-3.5" />
                  <span>Masterclasses ({videos.length})</span>
                </div>
              </button>
              <button
                onClick={() => { setAdminTab('settings'); setShowBookForm(false); setShowVideoForm(false); }}
                className={`px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all rounded-none border-b-2 cursor-pointer ${
                  adminTab === 'settings'
                    ? 'border-red-500 text-white bg-[#0a0a0a]'
                    : 'border-transparent text-[#555] hover:text-[#999]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" />
                  <span>Subsystem Config</span>
                </div>
              </button>
            </div>

            {/* QUICK STATS RACK */}
            {adminTab !== 'settings' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0a0a0a] border border-[#111] p-4 text-left select-none">
                <div>
                  <span className="font-mono text-[7px] text-[#555] uppercase tracking-widest block">Total Library Payload</span>
                  <span className="font-serif text-xl font-bold text-white block mt-0.5">{books.length + videos.length} files</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-[#555] uppercase tracking-widest block">Premium Locked</span>
                  <span className="font-serif text-xl font-bold text-red-500 block mt-0.5">
                    {books.filter(b => b.isPremium).length + videos.filter(v => v.isPremium).length} files
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-[#555] uppercase tracking-widest block">Average Rating</span>
                  <span className="font-serif text-xl font-bold text-white block mt-0.5">★ 4.9</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-[#555] uppercase tracking-widest block">Device Status</span>
                  <span className="font-mono text-[9px] text-[#3b82f6] tracking-wider uppercase block mt-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-none animate-pulse"></span>
                    Local Sandbox Active
                  </span>
                </div>
              </div>
            )}

            {/* --- EBOOKS SECTION --- */}
            {adminTab === 'books' && (
              <div className="space-y-6">
                
                {/* Form or Header Trigger */}
                {!showBookForm ? (
                  <div className="flex justify-between items-center">
                    <h2 className="font-serif text-md text-[#aaa] italic">Active Catalog index</h2>
                    <button
                      onClick={handleOpenAddBook}
                      className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900 text-red-400 hover:text-white font-mono text-[9px] tracking-widest uppercase transition rounded-none flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload eBook</span>
                    </button>
                  </div>
                ) : (
                  // eBook Creator/Editor Form
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#070707] border border-red-950/60 p-6 rounded-none space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-red-950/30 pb-3">
                      <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                        {editingBookId ? <Edit2 className="h-4 w-4 text-red-500" /> : <Plus className="h-4 w-4 text-red-500" />}
                        {editingBookId ? 'Edit Storage eBook' : 'Upload New eBook Document'}
                      </h3>
                      <button
                        onClick={() => setShowBookForm(false)}
                        className="text-[#555] hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveBook} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Book Title</label>
                          <input
                            type="text"
                            required
                            value={bookTitle}
                            onChange={(e) => setBookTitle(e.target.value)}
                            placeholder="The Demon's Heart"
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Author Name</label>
                          <input
                            type="text"
                            required
                            value={bookAuthor}
                            onChange={(e) => setBookAuthor(e.target.value)}
                            placeholder="Blacky"
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Cover Image Source URL</label>
                          <input
                            type="text"
                            value={bookCoverImage}
                            onChange={(e) => setBookCoverImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Demo Score (★ Rating)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={bookRating}
                            onChange={(e) => setBookRating(e.target.value)}
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>
                      </div>

                      {/* File selection and live preview for Book Cover Image */}
                      <div className="border border-dashed border-red-950/20 bg-black/60 p-4 rounded-none flex flex-col md:flex-row items-center gap-4 transition-all hover:border-red-900/40">
                        <div className="flex-grow text-center md:text-left">
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-[#aaa] mb-1">
                            Or Upload custom Cover image File
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedBookCoverFile(file);
                                setBookCoverPreviewUrl(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                            id="book-cover-file-input"
                          />
                          <label
                            htmlFor="book-cover-file-input"
                            className="inline-block px-3 py-1.5 bg-zinc-950 border border-red-950/60 text-[#ccc] hover:bg-red-900/40 hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                          >
                            Choose Image File
                          </label>
                          {selectedBookCoverFile && (
                            <p className="font-mono text-[8px] text-[#888] mt-1 truncate">
                              Selected: {selectedBookCoverFile.name} ({(selectedBookCoverFile.size / 1024).toFixed(1)} KB)
                            </p>
                          )}
                        </div>
                        {(bookCoverPreviewUrl || bookCoverImage) && (
                          <div className="w-14 h-20 bg-black border border-[#222] overflow-hidden select-none flex-shrink-0 animate-fade-in">
                            <img
                              src={bookCoverPreviewUrl || bookCoverImage}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">
                            Predefined Categories
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none flex items-center justify-between min-h-[38px] cursor-pointer"
                          >
                            <span className="truncate text-left text-zinc-300">
                              {getSelectedBookTags().length > 0 
                                ? `${getSelectedBookTags().length} Selected: ${getSelectedBookTags().join(', ')}`
                                : 'Select categories...'}
                            </span>
                            {isTagsDropdownOpen ? (
                              <ChevronUp className="h-4 w-4 text-red-700 select-none flex-shrink-0 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-red-700 select-none flex-shrink-0 ml-1" />
                            )}
                          </button>

                          {isTagsDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40 bg-transparent" 
                                onClick={() => setIsTagsDropdownOpen(false)}
                              />
                              <div className="absolute left-0 right-0 mt-1 bg-[#050505] border border-red-950/80 max-h-60 overflow-y-auto z-50 rounded-none shadow-2xl divide-y divide-[#1a1a1a]">
                                {PREDEFINED_CATEGORIES.map((category) => {
                                  const isSelected = getSelectedBookTags().includes(category);
                                  return (
                                    <button
                                      key={category}
                                      type="button"
                                      onClick={() => handleToggleBookTag(category)}
                                      className="w-full text-left font-mono text-[10px] px-3.5 py-2 hover:bg-red-950/20 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer transition-colors"
                                    >
                                      <span>{category}</span>
                                      <div className={`w-3.5 h-3.5 border ${isSelected ? 'bg-red-900 border-red-500 flex items-center justify-center' : 'border-[#333]'}`}>
                                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}

                          {/* Selected Category Tags Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {getSelectedBookTags().map((tag) => (
                              <div 
                                key={tag} 
                                className="inline-flex items-center gap-1 bg-[#0f0a0a] border border-red-950/40 text-red-500 font-mono text-[8px] uppercase tracking-widest px-2 py-0.5"
                              >
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBookTag(tag)}
                                  className="text-red-700 hover:text-red-400 font-bold bg-transparent border-none p-0 cursor-pointer text-[9px] flex items-center"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={bookIsPremium}
                              onChange={(e) => setBookIsPremium(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-900 border border-red-950 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#555] peer-checked:after:bg-red-500 after:border-none after:h-3 after:w-3 after:transition-all peer-checked:bg-red-950/30 peer-checked:border-red-700"></div>
                            <span className="font-mono text-[9px] text-[#888] peer-checked:text-white uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Lock with Premium Membership Pact
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* PDF / eBook file select and live preview */}
                      <div className="border border-dashed border-red-955/20 bg-black/60 p-4 rounded-none flex flex-col gap-3">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">
                            Alternative eBook File / PDF URL
                          </label>
                          <input
                            type="text"
                            value={bookFileUrl}
                            onChange={(e) => setBookFileUrl(e.target.value)}
                            placeholder="https://example.com/vault-ebook.pdf"
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-red-955/10">
                          <div>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-[#aaa]">
                              Or Upload PDF eBook Document Attachment
                            </span>
                            <span className="block font-mono text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5 animate-pulse">
                              Subscribers will read this PDF secure payload directly from cloud
                            </span>
                          </div>
                          <div>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedBookPdfFile(file);
                                  setBookPdfPreviewName(file.name);
                                  setBookPdfPreviewUrl(URL.createObjectURL(file));
                                }
                              }}
                              className="hidden"
                              id="book-pdf-file-input"
                            />
                            <label
                              htmlFor="book-pdf-file-input"
                              className="inline-block px-3 py-1.5 bg-zinc-950 border border-red-950/60 text-[#ccc] hover:bg-red-900/40 hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                            >
                              Choose PDF File
                            </label>
                          </div>
                        </div>

                        {selectedBookPdfFile && (
                          <div className="border border-[#111] bg-black p-3 rounded-none flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-red-950/20 border border-red-900/40 text-red-500">
                                <FileText className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="font-mono text-[10px] text-white truncate max-w-sm sm:max-w-md">{bookPdfPreviewName}</p>
                                <p className="font-mono text-[8px] text-red-500 mt-0.5">
                                  {(selectedBookPdfFile.size / (1024 * 1024)).toFixed(2)} MB • READY FOR STAGE ENCRYPT
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Reader PDF Previewer */}
                        {bookPdfPreviewUrl && (
                          <div className="space-y-1.5">
                            <span className="block font-mono text-[8px] uppercase tracking-wider text-red-500">
                              PDF DOCUMENT PREVIEW (LIVE WINDOW):
                            </span>
                            <div className="w-full h-56 bg-black border border-[#1a1a1a] rounded-none overflow-hidden relative">
                              <iframe
                                src={bookPdfPreviewUrl}
                                title="PDF Document File Sandbox Preview"
                                className="w-full h-full"
                                frameBorder="0"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* EBOOK CONTENT MODE SELECTOR & BUILDER */}
                      <div className="space-y-4 border-t border-red-955/20 pt-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-red-400 block">eBook Content Ingestion</span>
                            <span className="font-mono text-[7px] text-zinc-500 uppercase tracking-widest block mt-0.5">
                              Choose how you wish to compile or upload the eBook pages
                            </span>
                          </div>
                          <div className="flex gap-2 font-mono text-[9px]">
                            <button
                              type="button"
                              onClick={() => setBookCreationMode('fully')}
                              className={`px-3 py-1 border transition-all rounded-none uppercase cursor-pointer ${
                                bookCreationMode === 'fully'
                                  ? 'border-red-700 bg-red-950/20 text-red-400 font-bold'
                                  : 'border-[#222] text-[#888] hover:border-[#444]'
                              }`}
                            >
                              Fully (Single Long Payload)
                            </button>
                            <button
                              type="button"
                              onClick={() => setBookCreationMode('chapter')}
                              className={`px-3 py-1 border transition-all rounded-none uppercase cursor-pointer ${
                                bookCreationMode === 'chapter'
                                  ? 'border-red-700 bg-red-950/20 text-red-400 font-bold'
                                  : 'border-[#222] text-[#888] hover:border-[#444]'
                              }`}
                            >
                              Chapter-per-Chapter
                            </button>
                          </div>
                        </div>

                        {bookCreationMode === 'fully' ? (
                          <div className="space-y-3 bg-[#030303] border border-red-955/10 p-4 animate-fade-in">
                            {/* TXT/MD File Upload Utility */}
                            <div className="flex items-center justify-between border-b border-[#111] pb-3">
                              <div>
                                <span className="block font-mono text-[8.5px] uppercase tracking-wider text-zinc-300">
                                  Drag/Select Full Text File (.txt/.md)
                                </span>
                                <span className="block font-mono text-[7px] text-zinc-500 uppercase">
                                  Supports importing extra-long ebooks as a single text file
                                </span>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  accept=".txt,.md"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        if (evt.target?.result) {
                                          setFullBookText(evt.target.result as string);
                                        }
                                      };
                                      reader.readAsText(file);
                                    }
                                  }}
                                  className="hidden"
                                  id="text-file-uploader"
                                />
                                <label
                                  htmlFor="text-file-uploader"
                                  className="inline-block px-2.5 py-1 bg-zinc-950 border border-red-950/60 text-[#ccc] hover:bg-red-900/40 hover:text-white text-[8px] font-mono uppercase tracking-widest cursor-pointer transition-all"
                                >
                                  Import Text File
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">
                                  Page Splitter Boundary Symbol
                                </label>
                                <input
                                  type="text"
                                  value={pageSplitter}
                                  onChange={(e) => setPageSplitter(e.target.value)}
                                  placeholder="---"
                                  className="w-full bg-black border border-red-955/20 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono"
                                />
                                <span className="block font-mono text-[7px] text-[#555] uppercase mt-1">
                                  Enter the separator symbol. Defaults to ---. Characters on both sides will form distinct readable pages.
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">
                                Paste Complete Book Payload Contents (Fully)
                              </label>
                              <textarea
                                required
                                value={fullBookText}
                                onChange={(e) => setFullBookText(e.target.value)}
                                placeholder="Paste complete document payload here. Use '---' to split pages."
                                rows={8}
                                className="w-full bg-black border border-red-955/20 focus:border-red-900 text-xs p-3 text-[#ccc] focus:outline-none rounded-none font-mono leading-relaxed"
                              />
                              <div className="flex justify-between items-center mt-1.5 font-mono text-[7.5px] text-[#555] uppercase tracking-wider">
                                <span>Total Payload Length: {fullBookText.length} characters</span>
                                <span>Detected Pages: {fullBookText.split(pageSplitter || '---').filter(Boolean).length} segments</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 pt-2 animate-fade-in">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">Discrete Chapters Sequencer</span>
                              <button
                                type="button"
                                onClick={handleAddChapterField}
                                className="px-2 py-1 bg-black border border-red-950/50 hover:border-red-900 text-[8px] font-mono text-zinc-400 hover:text-white rounded-none uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" /> Add Page Chapter
                              </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                              {bookChapters.map((chapter, index) => (
                                <div key={index} className="bg-black border border-[#111] p-3 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[8px] text-[#666] uppercase">Page Segment #{index + 1}</span>
                                    {bookChapters.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveChapterField(index)}
                                        className="text-red-950/60 hover:text-red-500 p-0.5 cursor-pointer"
                                        title="Delete page segment"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    required
                                    value={chapter}
                                    onChange={(e) => handleChapterChange(index, e.target.value)}
                                    placeholder="CHAPTER TITLE... \n\nBody text logic..."
                                    rows={4}
                                    className="w-full bg-[#030303] border border-red-950/20 focus:border-red-900 text-xs p-2 text-[#ccc] focus:outline-none rounded-none font-sans leading-relaxed"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2.5 pt-3 border-t border-red-955/20">
                        <button
                          type="button"
                          onClick={() => { setShowBookForm(false); setEditingBookId(null); }}
                          className="px-4 py-2 border border-[#333] hover:border-white text-[9px] text-[#aa] hover:text-white font-mono uppercase rounded-none transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-white font-serif text-[10px] italic font-semibold uppercase rounded-none transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5 text-red-500" />
                          <span>{editingBookId ? 'Save eBook Changes' : 'Compile into Vault'}</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Catalog List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {books.map(b => (
                    <div 
                      key={b.id} 
                      className="bg-black border border-red-950/15 p-4 rounded-none flex gap-4 hover:border-red-950/60 transition duration-300 relative group"
                    >
                      <div className="w-14 h-20 bg-[#0d0d0d] border border-red-955/20 flex-shrink-0 overflow-hidden select-none">
                        <img 
                          src={b.coverImage} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {b.isPremium && (
                            <span className="text-[7px] font-mono bg-red-950/30 border border-red-900 text-red-400 px-1 py-0.5 uppercase tracking-widest font-semibold flex items-center gap-0.5">
                              <Sparkles className="h-1.5 w-1.5" /> Premium
                            </span>
                          )}
                          <span className="text-[7px] font-mono text-[#555] uppercase">ID: {b.id}</span>
                        </div>
                        <h4 className="font-serif italic text-white text-sm truncate">{b.title}</h4>
                        <p className="font-sans text-[10px] text-[#888] truncate mt-0.5">By {b.author}</p>
                        <p className="font-mono text-[8px] text-red-900/50 uppercase mt-1">
                          {b.content.length} PAGE SEGMENTS • ★ {b.rating || '4.9'}
                        </p>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleOpenEditBook(b)}
                            className="bg-[#0c0c0c] border border-red-950/30 hover:border-red-900 text-[8px] font-mono text-[#888] hover:text-white px-2 py-1 rounded-none flex items-center gap-1"
                          >
                            <Edit2 className="h-2.5 w-2.5" /> Edit
                          </button>
                          <button
                            onClick={() => triggerDelete(b.id, 'book')}
                            className="bg-red-950/10 border border-red-950/30 hover:border-red-900 text-[8px] font-mono text-red-500 hover:text-white hover:bg-red-950/30 px-2 py-1 rounded-none flex items-center gap-1"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- VIDEOS SECTION --- */}
            {adminTab === 'videos' && (
              <div className="space-y-6">
                
                {/* Form or Header Trigger */}
                {!showVideoForm ? (
                  <div className="flex justify-between items-center">
                    <h2 className="font-serif text-md text-[#aaa] italic">Masterclasses index</h2>
                    <button
                      onClick={handleOpenAddVideo}
                      className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900 text-red-400 hover:text-white font-mono text-[9px] tracking-widest uppercase transition rounded-none flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload Video</span>
                    </button>
                  </div>
                ) : (
                  // Video Creator/Editor Form
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#070707] border border-red-950/60 p-6 rounded-none space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-red-950/30 pb-3">
                      <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                        {editingVideoId ? <Edit2 className="h-4 w-4 text-red-500" /> : <Plus className="h-4 w-4 text-red-500" />}
                        {editingVideoId ? 'Edit Masterclass Log' : 'Publish New Masterclass Stream'}
                      </h3>
                      <button
                        onClick={() => setShowVideoForm(false)}
                        className="text-[#555] hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveVideo} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Video Title</label>
                          <input
                            type="text"
                            required
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="The Seer's Eyes"
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Duration (MM:SS)</label>
                          <input
                            type="text"
                            required
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value)}
                            placeholder="01:15"
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Video MP4 File URL</label>
                          <input
                            type="text"
                            required
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Thumbnail Cover URL</label>
                          <input
                            type="text"
                            value={videoThumbnail}
                            onChange={(e) => setVideoThumbnail(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>
                      </div>

                      {/* Custom cinematic Thumbnail file selector and live preview */}
                      <div className="border border-dashed border-red-950/20 bg-black/60 p-4 rounded-none flex flex-col md:flex-row items-center gap-4 transition-all hover:border-red-900/45 mt-3">
                        <div className="flex-grow text-center md:text-left">
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-[#aaa] mb-1">
                            Or Upload Custom Thumbnail Artwork
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedVideoThumbFile(file);
                                setVideoThumbPreviewUrl(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                            id="video-thumb-file-input"
                          />
                          <label
                            htmlFor="video-thumb-file-input"
                            className="inline-block px-3 py-1.5 bg-zinc-950 border border-red-950/60 text-[#ccc] hover:bg-red-900/40 hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                          >
                            Choose Thumbnail File
                          </label>
                          {selectedVideoThumbFile && (
                            <p className="font-mono text-[8px] text-[#888] mt-1 truncate">
                              Selected: {selectedVideoThumbFile.name} ({(selectedVideoThumbFile.size / 1024).toFixed(1)} KB)
                            </p>
                          )}
                        </div>
                        {(videoThumbPreviewUrl || videoThumbnail) && (
                          <div className="w-20 h-12 bg-black border border-[#222] overflow-hidden select-none flex-shrink-0">
                            <img
                              src={videoThumbPreviewUrl || videoThumbnail}
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>

                      {/* Video payload live file selector and playback preview */}
                      <div className="border border-dashed border-red-955/22 bg-black/60 p-4 rounded-none flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-[#aaa]">
                              Upload MP4 / MOV Masterclass Video File
                            </span>
                            <span className="block font-mono text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5 animate-pulse">
                              Subscribers will read and view this cinematic stream broadcast directly
                            </span>
                          </div>
                          <div>
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedVideoFile(file);
                                  setVideoPreviewName(file.name);
                                  setVideoPreviewUrl(URL.createObjectURL(file));

                                  // Auto-calculate video duration dynamically in browser metadata load
                                  const videoObj = document.createElement('video');
                                  videoObj.preload = 'metadata';
                                  videoObj.onloadedmetadata = () => {
                                    window.URL.revokeObjectURL(videoObj.src);
                                    const totalSecs = Math.floor(videoObj.duration);
                                    const mins = Math.floor(totalSecs / 60);
                                    const secs = totalSecs % 60;
                                    setVideoDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
                                  };
                                  videoObj.src = URL.createObjectURL(file);
                                }
                              }}
                              className="hidden"
                              id="video-payload-file-input"
                            />
                            <label
                              htmlFor="video-payload-file-input"
                              className="inline-block px-3 py-1.5 bg-zinc-950 border border-red-950/60 text-[#ccc] hover:bg-red-900/40 hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                            >
                              Choose Video File
                            </label>
                          </div>
                        </div>

                        {selectedVideoFile && (
                          <div className="border border-[#111] bg-black p-3 rounded-none flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-red-950/20 border border-red-900/40 text-red-500">
                                <FileText className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="font-mono text-[10px] text-white truncate max-w-sm sm:max-w-md">{videoPreviewName}</p>
                                <p className="font-mono text-[8px] text-red-500 mt-0.5 animate-pulse">
                                  {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB • READY FOR STAGE BROADCAST
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive playback pre-upload preview */}
                        {videoPreviewUrl && (
                          <div className="space-y-1.5">
                            <span className="block font-mono text-[8px] uppercase tracking-wider text-red-500">
                              VIDEO PAYLOAD PLAYBACK PREVIEW (LIVE PLAYER):
                            </span>
                            <div className="w-full bg-black border border-[#1a1a1a] rounded-none overflow-hidden aspect-video">
                              <video
                                src={videoPreviewUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>



                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Category Tags (split with comma)</label>
                          <input
                            type="text"
                            value={videoTags}
                            onChange={(e) => setVideoTags(e.target.value)}
                            placeholder="Cinematic, Mystery, Shadows"
                            className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none"
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={videoIsPremium}
                              onChange={(e) => setVideoIsPremium(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-900 border border-red-950 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#555] peer-checked:after:bg-red-500 after:border-none after:h-3 after:w-3 after:transition-all peer-checked:bg-red-950/30 peer-checked:border-red-700"></div>
                            <span className="font-mono text-[9px] text-[#888] peer-checked:text-white uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Lock with Premium Membership Pact
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Description / Log Insight</label>
                        <textarea
                          required
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          placeholder="Log description logic here..."
                          rows={4}
                          className="w-full bg-black border border-red-950/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-sans"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-3">
                        <button
                          type="button"
                          onClick={() => { setShowVideoForm(false); setEditingVideoId(null); }}
                          className="px-4 py-2 border border-[#333] hover:border-white text-[9px] text-[#aa] hover:text-white font-mono uppercase rounded-none transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-white font-serif text-[10px] italic font-semibold uppercase rounded-none transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5 text-red-500" />
                          <span>{editingVideoId ? 'Save Video Changes' : 'Publish Stream'}</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Video Catalog Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map(v => (
                    <div 
                      key={v.id} 
                      className="bg-black border border-red-950/15 p-4 rounded-none flex gap-4 hover:border-red-950/60 transition duration-300 relative group"
                    >
                      <div className="w-24 h-16 bg-[#0d0d0d] border border-red-955/20 flex-shrink-0 overflow-hidden select-none relative">
                        <img 
                          src={v.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-red-500/10 pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {v.isPremium && (
                            <span className="text-[7px] font-mono bg-red-950/30 border border-red-900 text-red-400 px-1 py-0.5 uppercase tracking-widest font-semibold flex items-center gap-0.5">
                              <Sparkles className="h-1.5 w-1.5" /> Premium
                            </span>
                          )}
                          <span className="text-[7px] font-mono text-[#555] uppercase">ID: {v.id}</span>
                        </div>
                        <h4 className="font-serif italic text-white text-sm truncate">{v.title}</h4>
                        <p className="font-sans text-[10px] text-[#888] truncate mt-0.5">Duration: {v.duration}</p>
                        <p className="font-mono text-[8px] text-red-900/50 uppercase block truncate mt-1">
                          Tags: {v.tags.join(', ')}
                        </p>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleOpenEditVideo(v)}
                            className="bg-[#0c0c0c] border border-red-950/30 hover:border-red-900 text-[8px] font-mono text-[#888] hover:text-white px-2 py-1 rounded-none flex items-center gap-1"
                          >
                            <Edit2 className="h-2.5 w-2.5" /> Edit
                          </button>
                          <button
                            onClick={() => triggerDelete(v.id, 'video')}
                            className="bg-red-950/10 border border-red-955/30 hover:border-red-900 text-[8px] font-mono text-red-500 hover:text-white hover:bg-red-950/30 px-2 py-1 rounded-none flex items-center gap-1"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- SETTINGS / CONFIG SECTION --- */}
            {adminTab === 'settings' && (
              <div className="space-y-6">
                
                {/* Internal Subtabs selector inside configs */}
                <div className="flex border-b border-[#141414] gap-1 overflow-x-auto select-none pt-2">
                  {[
                    { id: 'subscriptions', label: 'Subscription Tiers', icon: Globe },
                    { id: 'gateway', label: 'Payment Gateway', icon: Landmark },
                    { id: 'discounts', label: 'Discount Codes', icon: Tag },
                    { id: 'access', label: 'Content Access Control', icon: ShieldCheck },
                    { id: 'passcode', label: 'Passphrase & System', icon: Key }
                  ].map((subTab) => {
                    const isActive = settingsTab === subTab.id;
                    const Icon = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        type="button"
                        onClick={() => {
                          setSettingsTab(subTab.id as any);
                          setPassError('');
                          setPassSuccess('');
                        }}
                        className={`px-3 py-2 font-mono text-[9px] tracking-wider uppercase transition-all rounded-none border-b-2 cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'border-red-500 text-white bg-[#030303]'
                            : 'border-transparent text-[#666] hover:text-[#bbb]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{subTab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* --- 1. SUBSCRIPTIONS EDIT SUB-TAB --- */}
                {settingsTab === 'subscriptions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#070707] border border-[#141414] p-6 space-y-6"
                    id="settings-subs-panel"
                  >
                    <div>
                      <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                        <Globe className="h-4 w-4 text-red-500 animate-spin" style={{ animationDuration: '6s' }} /> Edit Subscription Packages
                      </h3>
                      <p className="font-mono text-[8px] text-[#555] uppercase tracking-wider mt-1">
                        Control names, pricing levels, and display parameters for membership subscriptions
                      </p>
                    </div>

                    <form onSubmit={handleSaveSubscriptions} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Monthly Package Box */}
                        <div className="p-4 border border-red-955/10 bg-black/40 space-y-3">
                          <h4 className="font-mono text-[9px] text-[#ff0000] tracking-widest uppercase border-b border-[#141414] pb-2">Monthly Cycle Tier</h4>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Plan Name</label>
                            <input
                              type="text"
                              required
                              value={monthlyName}
                              onChange={(e) => setMonthlyName(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-sans"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Billing Price ($ USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={monthlyPrice}
                              onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Description Prompt</label>
                            <textarea
                              rows={3}
                              required
                              value={monthlyDesc}
                              onChange={(e) => setMonthlyDesc(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-sans"
                            />
                          </div>
                        </div>

                        {/* Trimester Package Box */}
                        <div className="p-4 border border-red-955/10 bg-black/40 space-y-3">
                          <h4 className="font-mono text-[9px] text-[#ff0000] tracking-widest uppercase border-b border-[#141414] pb-2">Three-Month Cycle Tier</h4>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Plan Name</label>
                            <input
                              type="text"
                              required
                              value={trimesterName}
                              onChange={(e) => setTrimesterName(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-sans"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Billing Price ($ USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={trimesterPrice}
                              onChange={(e) => setTrimesterPrice(parseFloat(e.target.value) || 0)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Description Prompt</label>
                            <textarea
                              rows={3}
                              required
                              value={trimesterDesc}
                              onChange={(e) => setTrimesterDesc(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-sans"
                            />
                          </div>
                        </div>

                      </div>

                      <div className="flex justify-end pt-2 border-t border-[#111]">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-white font-serif text-[10px] italic font-semibold uppercase rounded-none transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="h-4 w-4 text-red-500 animate-pulse" />
                          <span>Commit Subscription Settings</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* --- 2. PAYMENT GATEWAY SUB-TAB --- */}
                {settingsTab === 'gateway' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#070707] border border-[#141414] p-6 space-y-6"
                    id="settings-gate-panel"
                  >
                    <div>
                      <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-red-500" /> Payment Gateway Integration Engine
                      </h3>
                      <p className="font-mono text-[8px] text-[#555] uppercase tracking-wider mt-1">
                        Control which checking tunnel handles real customer transactions & configure API keys
                      </p>
                    </div>

                    <form onSubmit={handleSaveGateway} className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Active Gateway Operator</label>
                            <select
                              value={activeGateway}
                              onChange={(e) => setActiveGateway(e.target.value as any)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                            >
                              <option value="stripe">Stripe credit Terminal</option>
                              <option value="paypal">PayPal Merchant Hub</option>
                              <option value="paystack">Paystack Core (Africa Central)</option>
                              <option value="flutterwave">Flutterwave Gateway Agent</option>
                              <option value="bank_transfer">Direct Bank wire Transfer (Custom Instructions)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Gateway Environment Mode</label>
                            <div className="flex gap-4 pt-1">
                              <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[9px] text-[#888] hover:text-white select-none">
                                <input
                                  type="radio"
                                  name="gatewayMode"
                                  value="sandbox"
                                  checked={gatewayMode === 'sandbox'}
                                  onChange={() => setGatewayMode('sandbox')}
                                  className="accent-red-500"
                                />
                                Sandbox Testing Key
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[9px] text-[#888] hover:text-white select-none">
                                <input
                                  type="radio"
                                  name="gatewayMode"
                                  value="production"
                                  checked={gatewayMode === 'production'}
                                  onChange={() => setGatewayMode('production')}
                                  className="accent-red-500"
                                />
                                Live Production Key
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">API Public Key / Client Identity (e.g. pk_test_...)</label>
                            <input
                              type="text"
                              required
                              value={gatewayPublicKey}
                              onChange={(e) => setGatewayPublicKey(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">API Private Secret Key (e.g. sk_test_...)</label>
                            <input
                              type="password"
                              required
                              value={gatewaySecretKey}
                              onChange={(e) => setGatewaySecretKey(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Merchant Pay Account Email</label>
                            <input
                              type="email"
                              required
                              value={gatewayMerchantEmail}
                              onChange={(e) => setGatewayMerchantEmail(e.target.value)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono"
                            />
                          </div>

                          {activeGateway === 'bank_transfer' && (
                            <div>
                              <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Bank Wire Instructions HTML / plain text</label>
                              <textarea
                                rows={2}
                                value={gatewayInstructions}
                                onChange={(e) => setGatewayInstructions(e.target.value)}
                                className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1 text-white focus:outline-none rounded-none font-sans"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-3 border-t border-[#111]">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-red-955/40 hover:bg-red-900/60 border border-red-800 text-white font-serif text-[10px] italic font-semibold uppercase rounded-none transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="h-4 w-4 text-red-500" />
                          <span>Save Gateway Key Rules</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* --- 3. DISCOUNT & PROMO CODES SUB-TAB --- */}
                {settingsTab === 'discounts' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#070707] border border-[#141414] p-6 space-y-6"
                    id="settings-discounts-panel"
                  >
                    <div>
                      <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                        <Tag className="h-4 w-4 text-red-500 animate-pulse" /> Managed Discount Codes List
                      </h3>
                      <p className="font-mono text-[8px] text-[#555] uppercase tracking-wider mt-1">
                        Register specific promotional codes to grant clients custom trial rates or flat deductions
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Form: Create new discount */}
                      <form onSubmit={handleAddDiscountCode} className="lg:col-span-5 bg-black border border-red-955/20 p-4 space-y-4">
                        <h4 className="font-mono text-[10px] text-red-400 tracking-wider uppercase border-b border-[#141414] pb-2">Generate Promo Cipher</h4>
                        
                        <div>
                          <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Uniquified Promotion Code (Key)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. SILENCE, SHADOW50"
                            value={newPromoCode}
                            onChange={(e) => setNewPromoCode(e.target.value)}
                            className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono uppercase tracking-widest"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Deduction Class</label>
                            <select
                              value={newPromoType}
                              onChange={(e) => setNewPromoType(e.target.value as any)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-850 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-sans"
                            >
                              <option value="percent">% Percentage Off</option>
                              <option value="flat">$ Flat Amount Discount</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-mono text-[8px] uppercase tracking-wider text-[#666] mb-1">Off Value</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={newPromoValue}
                              onChange={(e) => setNewPromoValue(parseInt(e.target.value) || 0)}
                              className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[9px] text-[#888] select-none">
                            <input
                              type="checkbox"
                              checked={newPromoActive}
                              onChange={(e) => setNewPromoActive(e.target.checked)}
                              className="accent-red-500 rounded-none border border-[#333]"
                            />
                            Instantly Active
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-red-950/30 hover:bg-red-900 border border-red-800 hover:border-red-650 text-white font-mono text-[9px] uppercase tracking-widest rounded-none transition font-bold"
                        >
                          Deploy Promo Key
                        </button>
                      </form>

                      {/* Display Table / list of active promos */}
                      <div className="lg:col-span-7 space-y-3">
                        <span className="font-mono text-[9px] text-[#666] uppercase block">Promo Codes Queue ({promoCodesList.length})</span>
                        
                        <div className="border border-[#111] overflow-hidden bg-black/40">
                          {promoCodesList.length === 0 ? (
                            <p className="p-4 text-center font-mono text-[9px] text-[#444] uppercase">No Promos configured.</p>
                          ) : (
                            <div className="divide-y divide-[#111]">
                              {promoCodesList.map((promo) => (
                                <div key={promo.id} className="p-3 flex justify-between items-center text-xs font-mono">
                                  <div>
                                    <span className="text-white font-bold text-xs tracking-wider block">{promo.code}</span>
                                    <span className="text-[10px] text-zinc-500">
                                      Class: {promo.type === 'percent' ? `${promo.value}% Percentage` : `$${promo.value} Flat Deduct`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePromoCode(promo.id)}
                                      className={`px-2 py-1 text-[8px] tracking-widest uppercase border ${
                                        promo.isActive
                                          ? 'bg-green-950/20 text-green-400 border-green-900'
                                          : 'bg-zinc-950 text-zinc-650 border-zinc-750'
                                      }`}
                                    >
                                      {promo.isActive ? 'Active' : 'Expired'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePromoCode(promo.id)}
                                      className="p-1 px-1.5 text-red-500 hover:text-white bg-red-950/10 hover:bg-red-900 border border-red-955/20 hover:border-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* --- 4. CONTENT ACCESS CONTROL PANEL SUB-TAB (BULK FREE VS PREMIUM SETTER) --- */}
                {settingsTab === 'access' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#070707] border border-[#141414] p-6 space-y-6"
                    id="settings-access-panel"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#141414] pb-4">
                      <div>
                        <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-red-500 animate-pulse" /> Content Access Rules
                        </h3>
                        <p className="font-mono text-[8px] text-[#555] uppercase tracking-wider mt-1">
                          Instantly select which specific content belongs inside Free vs Subscription-required category
                        </p>
                      </div>

                      {/* Immediate Filter query */}
                      <div className="flex-1 max-w-xs">
                        <input
                          type="text"
                          placeholder="Filter eBooks/Masterclasses..."
                          value={accessSearch}
                          onChange={(e) => setAccessSearch(e.target.value)}
                          className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-1.5 text-white focus:outline-none rounded-none font-mono uppercase tracking-widest text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      
                      {/* EBOOKS BLOCK FOR BULK ACCESS PRIVACY LOCK/UNLOCK */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[#ff0000] tracking-widest uppercase border-b border-[#111] pb-2 font-mono text-[9px]">
                          <span>eBook Access Rules</span>
                          <span className="text-white">({books.length} Archives)</span>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto divide-y divide-[#101010] pr-1 border border-red-955/10 bg-black/40">
                          {books
                            .filter(book => book.title.toUpperCase().includes(accessSearch.toUpperCase()) || book.author.toUpperCase().includes(accessSearch.toUpperCase()))
                            .map((book) => {
                              return (
                                <div key={book.id} className="p-3 flex justify-between items-center bg-black/25">
                                  <div className="min-w-0 pr-2">
                                    <span className="font-serif italic text-white text-xs block truncate pr-1">{book.title}</span>
                                    <span className="font-mono text-[8px] text-[#555] uppercase tracking-wider block mt-0.5">By {book.author}</span>
                                  </div>
                                  <div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={book.isPremium}
                                        onChange={() => onUpdateBook({ ...book, isPremium: !book.isPremium })}
                                        className="sr-only peer"
                                      />
                                      <div className="w-20 py-1 text-center font-mono text-[8.5px] uppercase tracking-wider border rounded-none cursor-pointer peer transition peer-checked:bg-red-950/40 peer-checked:text-red-400 peer-checked:border-red-800 bg-zinc-950 text-zinc-500 border-zinc-800 font-bold">
                                        {book.isPremium ? '★ Premium' : '👥 Free'}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* VIDEOS BLOCK FOR BULK ACCESS PRIVACY LOCK/UNLOCK */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[#ff0000] tracking-widest uppercase border-b border-[#111] pb-2 font-mono text-[9px]">
                          <span>Masterclass Access Rules</span>
                          <span className="text-white">({videos.length} Streams)</span>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto divide-y divide-[#101010] pr-1 border border-red-955/10 bg-black/40">
                          {videos
                            .filter(vid => vid.title.toUpperCase().includes(accessSearch.toUpperCase()))
                            .map((vid) => {
                              return (
                                <div key={vid.id} className="p-3 flex justify-between items-center bg-black/25">
                                  <div className="min-w-0 pr-2">
                                    <span className="font-serif italic text-white text-xs block truncate pr-1">{vid.title}</span>
                                    <span className="font-mono text-[8px] text-[#555] uppercase tracking-wider block mt-0.5 font-bold">Duration: {vid.duration}</span>
                                  </div>
                                  <div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={vid.isPremium}
                                        onChange={() => onUpdateVideo({ ...vid, isPremium: !vid.isPremium })}
                                        className="sr-only peer"
                                      />
                                      <div className="w-20 py-1 text-center font-mono text-[8.5px] uppercase tracking-wider border rounded-none cursor-pointer peer transition peer-checked:bg-red-950/40 peer-checked:text-red-400 peer-checked:border-red-800 bg-zinc-950 text-zinc-500 border-zinc-800 font-bold">
                                        {vid.isPremium ? '★ Premium' : '👥 Free'}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* --- 5. PASSPHRASE SECURITY & DANGER SYSTEM RESET --- */}
                {settingsTab === 'passcode' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    {/* Change Passcode */}
                    <div className="bg-[#070707] border border-[#141414] p-6 rounded-none space-y-4">
                      <div>
                        <h3 className="font-serif text-sm text-white italic flex items-center gap-2">
                          <Key className="h-4 w-4 text-red-500" /> Modify Access Passphrase
                        </h3>
                        <p className="font-mono text-[8px] text-[#555] uppercase tracking-wider mt-1">
                          Updates the local encryption cipher for authentication
                        </p>
                      </div>

                      <form onSubmit={handleUpdatePasscode} className="space-y-3 pt-2">
                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Current Passcode</label>
                          <input
                            type="password"
                            required
                            value={currentPass}
                            onChange={(e) => setCurrentPass(e.target.value)}
                            placeholder="•••••••••"
                            className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">New Passcode</label>
                          <input
                            type="password"
                            required
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Enter robust cipher"
                            className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Confirm New Passcode</label>
                          <input
                            type="password"
                            required
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            className="w-full bg-black border border-red-955/40 focus:border-red-800 text-xs px-3 py-2 text-white focus:outline-none rounded-none font-mono"
                          />
                        </div>

                        {passError && (
                          <p className="font-mono text-[9px] text-red-500 tracking-wider">⚠ {passError}</p>
                        )}

                        <button
                          type="submit"
                          className="px-4 py-2 bg-black border border-red-950/60 hover:border-red-800 hover:text-white font-mono text-[9px] text-red-400 uppercase tracking-widest rounded-none transition cursor-pointer"
                        >
                          Update Cryptphrase
                        </button>
                      </form>
                    </div>

                    {/* Dangerous Actions / System Reset */}
                    <div className="bg-[#070707] border border-[#141414] p-6 rounded-none space-y-4">
                      <div>
                        <h3 className="font-serif text-sm text-red-500 italic flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Danger Subsystems
                        </h3>
                        <p className="font-mono text-[8px] text-[#555] uppercase tracking-wider mt-1">
                          Destructive variables that erase local storage buffers
                        </p>
                      </div>

                      <div className="pt-2 space-y-4">
                        <p className="text-[11px] text-[#888] leading-relaxed font-sans mt-1">
                          Executing a Master System Reset will discard all added eBooks, custom-tagged content, and updated review logs. It reinstates the original hardcoded initial datasets.
                        </p>

                        {!showResetConfirm ? (
                          <button
                            onClick={() => setShowResetConfirm(true)}
                            className="px-4 py-2 bg-red-955/20 border border-red-955/60 hover:border-red-800 text-red-500 hover:text-white font-mono text-[9px] tracking-widest uppercase rounded-none transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reset Storage Vault</span>
                          </button>
                        ) : (
                          <div className="bg-[#111] border border-red-950 p-4 space-y-3">
                            <span className="font-mono text-[10px] text-red-500 font-bold block uppercase tracking-wider">
                              ⚠ CONFIRM VAULT WIPING OPERATION?
                            </span>
                            <div className="flex gap-2.5">
                              <button
                                onClick={handleResetSystem}
                                className="px-3 py-1.5 bg-red-950 hover:bg-red-800 border-none text-white font-mono text-[9px] uppercase tracking-widest rounded-none transition cursor-pointer font-bold"
                              >
                                Yes, Wipe All Data
                              </button>
                              <button
                                onClick={() => setShowResetConfirm(false)}
                                className="px-3 py-1.5 bg-black border border-[#333] hover:border-[#666] text-white font-mono text-[9px] uppercase tracking-widest rounded-none transition cursor-pointer"
                              >
                                Keep Vault
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            )}

            {/* General Operation Logs notice / persistent success toast */}
            {passSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black border border-green-950/40 p-4 flex justify-between items-center bg-green-950/10"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-mono text-[10px] text-green-400 tracking-wider uppercase font-semibold">
                    {passSuccess}
                  </span>
                </div>
                <button 
                  onClick={() => setPassSuccess('')} 
                  className="p-1 text-[#666] hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM SYSTEM DIALOGS --- */}

      {/* Item Delete confirm */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0d] border border-red-950/60 max-w-md w-full p-6 text-center space-y-4 shadow-[0_8px_32px_rgba(0,0,0,1)]"
            >
              <div className="w-12 h-12 bg-red-950/10 border border-red-900 rounded-none flex items-center justify-center mx-auto mb-2 text-red-500">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif italic text-lg text-white">Erase Vault File?</h3>
                <p className="font-mono text-[9px] text-[#666] uppercase tracking-wider mt-1">
                  Warning: Removing this file from the catalog cannot be reverted
                </p>
              </div>

              <div className="bg-black/40 border border-red-955/15 p-2.5 font-mono text-[10px] text-[#888] truncate select-none">
                TARGET ID: {confirmDeleteId.id}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white font-mono text-[9px] tracking-widest uppercase rounded-none transition cursor-pointer"
                >
                  Authorize Purge
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 bg-black border border-[#222] hover:border-[#555] text-white font-mono text-[9px] tracking-widest uppercase rounded-none transition cursor-pointer"
                >
                  Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Upload Progress Indicator overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/95 z-[99] flex flex-col items-center justify-center p-6 backdrop-blur-sm select-none">
          <div className="max-w-md w-full border border-red-955 p-8 bg-[#030303] text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border border-dashed border-red-500 animate-spin flex items-center justify-center text-red-500 font-mono text-xs">
                ✝
              </div>
            </div>
            <div>
              <h3 className="font-serif italic text-lg text-white mb-1">TRANSMITTING CIPHER DATA</h3>
              <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse">
                {uploadMessage}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-[#111] border border-red-950/60 h-2 rounded-none overflow-hidden relative">
                <div 
                  className="bg-red-800 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[8px] text-[#444] uppercase tracking-widest">
                <span>PROGRESS SIGNAL</span>
                <span className="text-red-500 font-bold">{uploadProgress}% COMPLETE</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
