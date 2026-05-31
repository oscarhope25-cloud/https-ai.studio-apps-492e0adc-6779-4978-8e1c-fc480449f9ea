# Deploying Blackshadow Library on Firebase

Firebase Hosting natively supports serving static single-page client apps. Because this application is full-stack (includes an Express.js backend running on Node), you can deploy it to **Firebase App Hosting** (the new modern full-stack standard for Vite + Node) or wrap it as a Cloud Function!

---

## Method 1: Deploying via Firebase App Hosting (Recommended)

Firebase App Hosting automatically detects full-stack Vite frameworks, builds them in the cloud, and serves them.

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Log into Firebase**:
   ```bash
   firebase login
   ```
3. **Initialize App Hosting**:
   Run the following in your project folder, choose your Firebase project, and link it with your GitHub repository:
   ```bash
   firebase apphosting:discover
   firebase apphosting:backends:create
   ```
4. Firebase will automatically read your `package.json` scripts, trigger `npm run build` to package both client files and `dist/server.cjs`, and run `npm start` in the secure production server!

---

## Method 2: Traditional Firebase Hosting + Cloud Functions (Restful Backend)

If you prefer to serve the static client using traditional Firebase Hosting and proxy backend requests `/api/*` to a Cloud Function:

1. **Initialize Firebase Configs**:
   ```bash
   firebase init hosting
   ```
2. Set your static site folder to `dist`.
3. Wrap files or write routing rules proxying to Cloud Functions inside your `firebase.json` configuration file:
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "/api/**",
           "function": "api"
         },
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
4. Build the client app (`npm run build`) and deploy:
   ```bash
   firebase deploy
   ```
