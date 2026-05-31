import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Film, Newspaper, HelpCircle, Star, Sparkles, LogIn, LogOut, Lock, Check, ShieldCheck, Smartphone, CheckSquare, MessageSquare } from 'lucide-react';
import { Book, Video, BlogPost, Review, Subscription } from './types';
import { INITIAL_BOOKS, INITIAL_VIDEOS, INITIAL_BLOGS, INITIAL_REVIEWS } from './data';

import BookLibrary from './components/BookLibrary';
import EBookReader from './components/EBookReader';
import VideoLibrary from './components/VideoLibrary';
import BlogPage from './components/BlogPage';
import ReviewPage from './components/ReviewPage';
import SubscriptionPaywall from './components/SubscriptionPaywall';
import AdminDashboard from './components/AdminDashboard';

// Firebase Client SDK Imports
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, writeBatch 
} from 'firebase/firestore';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User 
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'books' | 'videos' | 'blog' | 'reviews' | 'membership' | 'admin'>('books');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);

  // Synchronized Persistence State
  const [books, setBooks] = useState<Book[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [blogs] = useState<BlogPost[]>(INITIAL_BLOGS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscription, setSubscription] = useState<Subscription>({ isActive: false, plan: null });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Automatically sync & load user subscription document
        try {
          const subRef = doc(db, 'subscriptions', user.uid);
          const subSnap = await getDoc(subRef);
          if (subSnap.exists()) {
            setSubscription(subSnap.data() as Subscription);
          } else {
            // Check for pre-existing local trials and save them to Firestore
            const localSubStr = localStorage.getItem('blackshadow_library_sub');
            if (localSubStr) {
              const localSub = JSON.parse(localSubStr);
              if (localSub.isActive) {
                await setDoc(subRef, { ...localSub, userId: user.uid });
                setSubscription(localSub);
                return;
              }
            }
            setSubscription({ isActive: false, plan: null });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `subscriptions/${user.uid}`);
        }
      } else {
        const savedSub = localStorage.getItem('blackshadow_library_sub');
        setSubscription(savedSub ? JSON.parse(savedSub) : { isActive: false, plan: null });
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync eBooks, videos, and personalized progress overlays
  useEffect(() => {
    const syncCatalogs = async () => {
      try {
        const booksRef = collection(db, 'books');
        const booksSnap = await getDocs(booksRef);
        let loadedBooks: Book[] = [];
        booksSnap.forEach(d => {
          loadedBooks.push({ id: d.id, ...d.data() } as Book);
        });

        const videosRef = collection(db, 'videos');
        const videosSnap = await getDocs(videosRef);
        let loadedVideos: Video[] = [];
        videosSnap.forEach(d => {
          loadedVideos.push({ id: d.id, ...d.data() } as Video);
        });

        // Bootstrap database with standard items if empty
        if (loadedBooks.length === 0) {
          console.log('Bootstrapping cloud library eBooks...');
          const batch = writeBatch(db);
          INITIAL_BOOKS.forEach(b => {
            const bRef = doc(db, 'books', b.id);
            batch.set(bRef, {
              id: b.id,
              title: b.title,
              author: b.author,
              coverImage: b.coverImage || '',
              pdfUrl: b.pdfUrl || '',
              content: b.content,
              tags: b.tags,
              isPremium: b.isPremium
            });
          });
          await batch.commit().catch(e => console.error('Books batch fail:', e));
          loadedBooks = INITIAL_BOOKS;
        }

        if (loadedVideos.length === 0) {
          console.log('Bootstrapping cloud library Masterclass Videos...');
          const batch = writeBatch(db);
          INITIAL_VIDEOS.forEach(v => {
            const vRef = doc(db, 'videos', v.id);
            batch.set(vRef, {
              id: v.id,
              title: v.title,
              duration: v.duration,
              thumbnail: v.thumbnail,
              videoUrl: v.videoUrl,
              tags: v.tags,
              isPremium: v.isPremium,
              description: v.description
            });
          });
          await batch.commit().catch(e => console.error('Videos batch fail:', e));
          loadedVideos = INITIAL_VIDEOS;
        }

        // Apply personal progress offsets if authenticated
        if (currentUser) {
          const readsRef = collection(db, 'users', currentUser.uid, 'readingState');
          const readsSnap = await getDocs(readsRef);
          const userReadingStates = new Map<string, any>();
          readsSnap.forEach(d => {
            userReadingStates.set(d.id, d.data());
          });

          loadedBooks = loadedBooks.map(b => {
            const uState = userReadingStates.get(b.id);
            if (uState) {
              return {
                ...b,
                progress: uState.progress || 0,
                currentChapter: uState.currentChapter || 0,
                bookmarks: uState.bookmarks || [],
                notes: uState.notes || [],
                downloaded: uState.downloaded || false,
                wishlisted: uState.wishlisted || false
              };
            }
            return { ...b, progress: 0, currentChapter: 0, bookmarks: [], notes: [], wishlisted: false };
          });

          const watchRef = collection(db, 'users', currentUser.uid, 'watchingState');
          const watchSnap = await getDocs(watchRef);
          const userWatchStates = new Map<string, any>();
          watchSnap.forEach(d => {
            userWatchStates.set(d.id, d.data());
          });

          loadedVideos = loadedVideos.map(v => {
            const uState = userWatchStates.get(v.id);
            if (uState) {
              return {
                ...v,
                progress: uState.progress || 0,
                downloaded: uState.downloaded || false
              };
            }
            return { ...v, progress: 0 };
          });
        } else {
          const localBooksStr = localStorage.getItem('blackshadow_library_books');
          if (localBooksStr) {
            try {
              const parsedLocalBooks = JSON.parse(localBooksStr);
              const localMap = new Map(parsedLocalBooks.map((lb: Book) => [lb.id, lb]));
              loadedBooks = loadedBooks.map(b => {
                const localB = localMap.get(b.id) as Book | undefined;
                return {
                  ...b,
                  progress: localB?.progress || 0,
                  currentChapter: localB?.currentChapter || 0,
                  bookmarks: localB?.bookmarks || [],
                  notes: localB?.notes || [],
                  downloaded: localB?.downloaded || false,
                  wishlisted: localB?.wishlisted || false
                };
              });
            } catch (e) {
              loadedBooks = loadedBooks.map(b => ({ ...b, progress: 0, currentChapter: 0, bookmarks: [], notes: [], wishlisted: false }));
            }
          } else {
            loadedBooks = loadedBooks.map(b => ({ ...b, progress: 0, currentChapter: 0, bookmarks: [], notes: [], wishlisted: false }));
          }
          loadedVideos = loadedVideos.map(v => ({ ...v, progress: 0 }));
        }

        setBooks(loadedBooks);
        setVideos(loadedVideos);

      } catch (err) {
        console.warn('Fallback to local catalogues:', err);
        try {
          const booksRes = await fetch('/api/books');
          const videosRes = await fetch('/api/videos');
          if (booksRes.ok) setBooks(await booksRes.json());
          if (videosRes.ok) setVideos(await videosRes.json());
        } catch (e) {
          setBooks(INITIAL_BOOKS);
          setVideos(INITIAL_VIDEOS);
        }
      }
    };

    syncCatalogs();
  }, [currentUser]);

  // Real-time synchronization for community critique reviews
  useEffect(() => {
    try {
      const q = collection(db, 'reviews');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedReviews: Review[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedReviews.push({
            id: docSnap.id,
            itemType: data.itemType,
            itemId: data.itemId,
            itemTitle: data.itemTitle,
            author: data.author,
            rating: data.rating,
            comment: data.comment,
            date: data.date,
            likes: data.likes || 0,
            likedByUser: false
          });
        });
        
        if (loadedReviews.length > 0) {
          loadedReviews.sort((a, b) => b.id.localeCompare(a.id));
          setReviews(loadedReviews);
        } else {
          const savedReviews = localStorage.getItem('blackshadow_library_reviews');
          setReviews(savedReviews ? JSON.parse(savedReviews) : INITIAL_REVIEWS);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      });
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
    }
  }, [currentUser]);

  // Auth Helper Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error('Google Access Sign-In failed:', e);
      if (e?.code === 'auth/popup-closed-by-user') {
        setAuthError(
          "The Sign-In popup window was closed before completion. If you are using the embedded preview, some browsers block cross-origin popups by default. To log in successfully, please click 'Open in New Tab' at the top right of the preview and try again!"
        );
      } else {
        setAuthError(e?.message || String(e));
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign-Out failed:', e);
    }
  };

  // Sync state helpers
  const saveBooksState = async (updatedBooks: Book[]) => {
    setBooks(updatedBooks);
    localStorage.setItem('blackshadow_library_books', JSON.stringify(updatedBooks));
    fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBooks)
    }).catch(e => console.error('Failed to sync books to server:', e));
  };

  const saveVideosState = async (updatedVideos: Video[]) => {
    setVideos(updatedVideos);
    localStorage.setItem('blackshadow_library_videos', JSON.stringify(updatedVideos));
    fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVideos)
    }).catch(e => console.error('Failed to sync videos to server:', e));
  };

  // Triggering membership secure states
  const handleCheckoutSubscription = async (plan: 'monthly' | 'trimester') => {
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + (plan === 'trimester' ? 90 : 30));

    const updatedSub: Subscription = {
      isActive: true,
      plan: plan,
      trialStartDate: today.toISOString().split('T')[0],
      trialEndDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiresAt: expiry.toISOString().split('T')[0]
    };

    setSubscription(updatedSub);
    localStorage.setItem('blackshadow_library_sub', JSON.stringify(updatedSub));

    if (currentUser) {
      try {
        await setDoc(doc(db, 'subscriptions', currentUser.uid), {
          ...updatedSub,
          userId: currentUser.uid
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `subscriptions/${currentUser.uid}`);
      }
    }
  };

  const handleCancelSubscription = async () => {
    const updatedSub: Subscription = { isActive: false, plan: null };
    setSubscription(updatedSub);
    localStorage.setItem('blackshadow_library_sub', JSON.stringify(updatedSub));

    if (currentUser) {
      try {
        await setDoc(doc(db, 'subscriptions', currentUser.uid), {
          isActive: false,
          plan: null,
          userId: currentUser.uid
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `subscriptions/${currentUser.uid}`);
      }
    }
  };

  // Book custom states: updates read progress / current page
  const handleUpdateBookProgress = async (bookId: string, progress: number, currentChapter: number) => {
    const updated = books.map(b => b.id === bookId ? { ...b, progress, currentChapter } : b);
    setBooks(updated);
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook({ ...selectedBook, progress, currentChapter });
    }

    if (currentUser) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'readingState', bookId);
        await setDoc(uStateRef, { progress, currentChapter }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/readingState/${bookId}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
  };

  // Add Bookmarks
  const handleAddBookmark = async (bookId: string, chapterIndex: number) => {
    const target = books.find(b => b.id === bookId);
    if (!target) return;
    const bookmarks = target.bookmarks ? [...target.bookmarks] : [];
    if (!bookmarks.includes(chapterIndex)) {
      bookmarks.push(chapterIndex);
    }

    const updated = books.map(b => b.id === bookId ? { ...b, bookmarks } : b);
    setBooks(updated);
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook({ ...selectedBook, bookmarks });
    }

    if (currentUser) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'readingState', bookId);
        await setDoc(uStateRef, { bookmarks }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/readingState/${bookId}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
  };

  const handleRemoveBookmark = async (bookId: string, chapterIndex: number) => {
    const target = books.find(b => b.id === bookId);
    if (!target) return;
    const bookmarks = target.bookmarks ? target.bookmarks.filter(idx => idx !== chapterIndex) : [];

    const updated = books.map(b => b.id === bookId ? { ...b, bookmarks } : b);
    setBooks(updated);
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook({ ...selectedBook, bookmarks });
    }

    if (currentUser) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'readingState', bookId);
        await setDoc(uStateRef, { bookmarks }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/readingState/${bookId}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
  };

  // Notes synchronization
  const handleAddNote = async (bookId: string, chapterIndex: number, text: string) => {
    const target = books.find(b => b.id === bookId);
    if (!target) return;
    const noteTime = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const newNote = {
      id: `note-${Date.now()}`,
      chapterIndex,
      text,
      createdAt: noteTime
    };
    const notes = target.notes ? [...target.notes, newNote] : [newNote];

    const updated = books.map(b => b.id === bookId ? { ...b, notes } : b);
    setBooks(updated);
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook({ ...selectedBook, notes });
    }

    if (currentUser) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'readingState', bookId);
        await setDoc(uStateRef, { notes }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/readingState/${bookId}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
  };

  // Local eBook upload / Admin actions matching firestore rules
  const handleAddCustomBook = async (newBook: Book) => {
    const updated = [newBook, ...books];
    setBooks(updated);
    
    if (currentUser && currentUser.email === 'oscarhope25@gmail.com') {
      try {
        const cleanBook = {
          id: newBook.id,
          title: newBook.title,
          author: newBook.author,
          coverImage: newBook.coverImage || '',
          pdfUrl: newBook.pdfUrl || '',
          content: newBook.content,
          tags: newBook.tags,
          isPremium: newBook.isPremium
        };
        await setDoc(doc(db, 'books', newBook.id), cleanBook);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `books/${newBook.id}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
    
    fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(e => console.error('Failed to sync books to server:', e));
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    const updated = books.map(b => (b.id === updatedBook.id ? updatedBook : b));
    setBooks(updated);
    
    if (currentUser && currentUser.email === 'oscarhope25@gmail.com') {
      try {
        const cleanBook = {
          id: updatedBook.id,
          title: updatedBook.title,
          author: updatedBook.author,
          coverImage: updatedBook.coverImage || '',
          pdfUrl: updatedBook.pdfUrl || '',
          content: updatedBook.content,
          tags: updatedBook.tags,
          isPremium: updatedBook.isPremium
        };
        await setDoc(doc(db, 'books', updatedBook.id), cleanBook);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `books/${updatedBook.id}`);
      }
    }
    
    fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(e => console.error('Failed to sync books to server:', e));
  };

  const handleDeleteBook = async (bookId: string) => {
    const updated = books.filter(b => b.id !== bookId);
    setBooks(updated);
    
    if (currentUser && currentUser.email === 'oscarhope25@gmail.com') {
      try {
        await deleteDoc(doc(db, 'books', bookId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `books/${bookId}`);
      }
    }
    
    fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(e => console.error('Failed to sync books to server:', e));
  };

  const handleAddVideo = async (newVideo: Video) => {
    const updated = [newVideo, ...videos];
    setVideos(updated);
    
    if (currentUser && currentUser.email === 'oscarhope25@gmail.com') {
      try {
        const cleanVid = {
          id: newVideo.id,
          title: newVideo.title,
          duration: newVideo.duration,
          thumbnail: newVideo.thumbnail,
          videoUrl: newVideo.videoUrl,
          tags: newVideo.tags,
          isPremium: newVideo.isPremium,
          description: newVideo.description
        };
        await setDoc(doc(db, 'videos', newVideo.id), cleanVid);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `videos/${newVideo.id}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_videos', JSON.stringify(updated));
    }
    
    fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(e => console.error('Failed to sync videos to server:', e));
  };

  const handleUpdateVideo = async (updatedVideo: Video) => {
    const updated = videos.map(v => (v.id === updatedVideo.id ? updatedVideo : v));
    setVideos(updated);
    
    if (currentUser && currentUser.email === 'oscarhope25@gmail.com') {
      try {
        const cleanVid = {
          id: updatedVideo.id,
          title: updatedVideo.title,
          duration: updatedVideo.duration,
          thumbnail: updatedVideo.thumbnail,
          videoUrl: updatedVideo.videoUrl,
          tags: updatedVideo.tags,
          isPremium: updatedVideo.isPremium,
          description: updatedVideo.description
        };
        await setDoc(doc(db, 'videos', updatedVideo.id), cleanVid);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `videos/${updatedVideo.id}`);
      }
    }
    
    fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(e => console.error('Failed to sync videos to server:', e));
  };

  const handleDeleteVideo = async (videoId: string) => {
    const updated = videos.filter(v => v.id !== videoId);
    setVideos(updated);
    
    if (currentUser && currentUser.email === 'oscarhope25@gmail.com') {
      try {
        await deleteDoc(doc(db, 'videos', videoId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `videos/${videoId}`);
      }
    }
    
    fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(e => console.error('Failed to sync videos to server:', e));
  };

  const handleResetApp = async () => {
    localStorage.removeItem('blackshadow_library_books');
    localStorage.removeItem('blackshadow_library_videos');
    localStorage.removeItem('blackshadow_library_reviews');
    localStorage.removeItem('blackshadow_library_sub');
    
    setBooks(INITIAL_BOOKS);
    setVideos(INITIAL_VIDEOS);
    setReviews(INITIAL_REVIEWS);
    setSubscription({ isActive: false, plan: null });

    // Sync database reset with express
    fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books: INITIAL_BOOKS, videos: INITIAL_VIDEOS })
    }).catch(e => console.error('Failed to sync reset to server:', e));
  };

  // Custom tagging modifications
  const handleAddTagToBook = async (bookId: string, tag: string) => {
    const updated = books.map(b => {
      if (b.id === bookId) {
        const clean = tag.trim();
        if (clean && !b.tags.includes(clean)) {
          return { ...b, tags: [...b.tags, clean] };
        }
      }
      return b;
    });
    saveBooksState(updated);
  };

  const handleRemoveTagFromBook = async (bookId: string, tag: string) => {
    const updated = books.map(b => {
      if (b.id === bookId) {
        return { ...b, tags: b.tags.filter(t => t !== tag) };
      }
      return b;
    });
    saveBooksState(updated);
  };

  // Sandbox Toggle Downloader callbacks
  const handleToggleDownloadBook = async (bookId: string) => {
    const updated = books.map(b => {
      if (b.id === bookId) {
        return { ...b, downloaded: !b.downloaded };
      }
      return b;
    });
    setBooks(updated);
    const target = updated.find(b => b.id === bookId);
    if (currentUser && target) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'readingState', bookId);
        await setDoc(uStateRef, { downloaded: target.downloaded }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
  };

  const handleToggleDownloadVideo = async (videoId: string) => {
    const updated = videos.map(v => {
      if (v.id === videoId) {
        return { ...v, downloaded: !v.downloaded };
      }
      return v;
    });
    setVideos(updated);
    const target = updated.find(v => v.id === videoId);
    if (currentUser && target) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'watchingState', videoId);
        await setDoc(uStateRef, { downloaded: target.downloaded }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('blackshadow_library_videos', JSON.stringify(updated));
    }
  };

  const handleToggleWishlistBook = async (bookId: string) => {
    const updated = books.map(b => b.id === bookId ? { ...b, wishlisted: !b.wishlisted } : b);
    setBooks(updated);
    const target = updated.find(b => b.id === bookId);
    if (currentUser && target) {
      try {
        const uStateRef = doc(db, 'users', currentUser.uid, 'readingState', bookId);
        await setDoc(uStateRef, { wishlisted: !!target.wishlisted }, { merge: true });
      } catch (e) {
        console.error('Failed to update wishlist in Firestore:', e);
      }
    } else {
      localStorage.setItem('blackshadow_library_books', JSON.stringify(updated));
    }
  };

  // Reviews actions
  const handleAddReview = async (newReview: Review) => {
    if (currentUser) {
      try {
        const cleanReview = {
          id: newReview.id,
          itemType: newReview.itemType,
          itemId: newReview.itemId,
          itemTitle: newReview.itemTitle,
          author: newReview.author,
          rating: Number(newReview.rating),
          comment: newReview.comment,
          date: newReview.date,
          likes: 0,
          userId: currentUser.uid
        };
        await setDoc(doc(db, 'reviews', newReview.id), cleanReview);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `reviews/${newReview.id}`);
      }
    } else {
      const updated = [newReview, ...reviews];
      setReviews(updated);
      localStorage.setItem('blackshadow_library_reviews', JSON.stringify(updated));
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    const matched = reviews.find(r => r.id === reviewId);
    if (!matched) return;
    
    const userLiked = !matched.likedByUser;
    const incrementVal = userLiked ? 1 : -1;
    
    const updated = reviews.map(r => r.id === reviewId ? { ...r, likedByUser: userLiked, likes: r.likes + incrementVal } : r);
    setReviews(updated);
    
    if (currentUser) {
      try {
        const revRef = doc(db, 'reviews', reviewId);
        await updateDoc(revRef, { likes: (matched.likes || 0) + incrementVal });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `reviews/${reviewId}`);
      }
    } else {
      localStorage.setItem('blackshadow_library_reviews', JSON.stringify(updated));
    }
  };


  return (
    <div className="min-h-screen bg-transparent text-[#efeff0] font-sans flex flex-col justify-between selection:bg-rose-950 selection:text-red-200" id="app-wrapper">
      
      {/* Immersive Top Bar - Geometric & Goth Crimson Styled */}
      <header className="border-b border-[#2d0206] bg-[#070001df] backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_30px_rgba(30,2,4,0.4)]">
        {/* Top Accent bar matching blackshadow.blog */}
        <div className="h-[3px] w-full bg-gradient-to-r from-red-600 via-[#990a16] to-[#1c0104]"></div>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('books')}>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setLogoTapCount(prev => {
                  const val = prev + 1;
                  if (val >= 3) {
                    setActiveTab('admin');
                    return 0;
                  }
                  return val;
                });
                // Reset click counter after 1.5 seconds of inactivity
                setTimeout(() => setLogoTapCount(0), 1500);
              }}
              className="h-8 w-8 bg-[#150205] border border-red-950/80 hover:border-red-500 rounded-none flex items-center justify-center text-red-500 font-serif font-bold text-sm tracking-widest relative transition-colors duration-250 cursor-pointer logo-reflection"
              title="Double click or triple tap to access terminal"
            >
              ★
            </div>
            <div>
              <span className="font-serif text-xs italic tracking-[0.3em] text-red-100 uppercase block group-hover:text-red-500 transition-colors">Blackshadow Library</span>
              <span className="font-mono text-[7px] text-red-800/80 uppercase tracking-[0.3em] block mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-none bg-red-600 shadow-[0_0_4px_#ff0000]"></span>
                Offline Archives
              </span>
            </div>
          </div>

          {/* Scribe status / Subscription indicator */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="font-mono text-[9px] text-[#8a5d62] uppercase tracking-widest hidden sm:block">
                  {currentUser.email}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 border border-red-950 bg-[#0c0204] text-[9px] font-mono text-red-500 hover:text-white hover:bg-red-950 hover:border-red-800 uppercase tracking-widest rounded-none flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-3 py-1.5 border border-red-950 bg-black text-[9px] font-mono text-white hover:text-red-400 hover:border-red-650 uppercase tracking-widest rounded-none flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="h-3 w-3" />
                <span>Google Connect</span>
              </button>
            )}

            {subscription.isActive ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveTab('membership')}
                className="cursor-pointer px-3 py-1.5 border border-red-900 bg-[#140204] text-[9px] font-mono text-red-200 uppercase tracking-widest rounded-none flex items-center gap-2 hover:bg-[#250308] transition"
              >
                <Sparkles className="h-3 w-3 text-red-500" />
                <span>PREMIUM TRIAL KEY</span>
              </motion.div>
            ) : (
              <button
                onClick={() => setActiveTab('membership')}
                className="px-3 py-1.5 border border-red-950/60 hover:border-red-650 bg-black text-[9px] font-mono text-red-700/80 hover:text-white uppercase tracking-widest rounded-none flex items-center gap-1.5 transition-all"
              >
                <Lock className="h-3 w-3 text-red-900 group-hover:text-white" />
                <span>MEMBERSHIP PACT</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {authError && (
        <div className="max-w-7xl mx-auto px-4 mt-6" id="auth-error-banner">
          <div className="border border-red-950 bg-[#0c0505] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="text-red-500 font-mono text-sm leading-none mt-0.5">!</span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-500 font-semibold">Log-In Notice</p>
                <p className="text-[12px] text-zinc-400 mt-1.5 leading-relaxed">
                  {authError}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="px-2.5 py-1 border border-zinc-800 hover:border-zinc-700 bg-black text-[9px] font-mono text-zinc-400 hover:text-white uppercase tracking-widest rounded-none h-fit w-fit self-end sm:self-start transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="pt-4"
          >
            {activeTab === 'books' && (
              <BookLibrary
                books={books}
                subscription={subscription}
                onSelectBook={setSelectedBook}
                onAddBook={handleAddCustomBook}
                onOpenPaywall={() => setActiveTab('membership')}
                onAddTagToBook={handleAddTagToBook}
                onRemoveTagFromBook={handleRemoveTagFromBook}
                onToggleDownloadBook={handleToggleDownloadBook}
                onToggleWishlistBook={handleToggleWishlistBook}
              />
            )}

            {activeTab === 'videos' && (
              <VideoLibrary
                videos={videos}
                subscription={subscription}
                onSelectVideo={() => {}}
                onOpenPaywall={() => setActiveTab('membership')}
                onToggleDownloadVideo={handleToggleDownloadVideo}
              />
            )}

            {activeTab === 'blog' && (
              <BlogPage posts={blogs} />
            )}

            {activeTab === 'reviews' && (
              <ReviewPage
                reviews={reviews}
                books={books}
                videos={videos}
                onAddReview={handleAddReview}
                onLikeReview={handleLikeReview}
              />
            )}

            {activeTab === 'membership' && (
              <SubscriptionPaywall
                subscription={subscription}
                onSubscribe={handleCheckoutSubscription}
                onCancel={handleCancelSubscription}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                books={books}
                videos={videos}
                onAddBook={handleAddCustomBook}
                onUpdateBook={handleUpdateBook}
                onDeleteBook={handleDeleteBook}
                onAddVideo={handleAddVideo}
                onUpdateVideo={handleUpdateVideo}
                onDeleteVideo={handleDeleteVideo}
                onResetApp={handleResetApp}
                onClose={() => setActiveTab('books')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Aesthetic Cyberpunk Footer showing Access Terminal gateway */}
      <footer className="w-full text-center py-6 text-[9px] font-mono text-zinc-700 select-none mb-16 space-y-1">
        <div>© 2026 BLACKSHADOW ARCHIVIST DIRECTORY • SECURE END-TO-END SANDBOX</div>
        <div className="flex items-center justify-center gap-2">
          <span>ALL CHANNELS SECURED</span>
          <span>•</span>
          <button 
            onClick={() => setActiveTab('admin')} 
            className="text-zinc-650 hover:text-red-500 hover:underline transition-all bg-transparent border-none p-0 cursor-pointer font-mono tracking-widest uppercase text-[8px]"
          >
            [ACCESS ADMINISTRATIVE TERMINAL]
          </button>
        </div>
      </footer>

      {/* Primary Immersive eBook Reader Full-viewport Portal */}
      <AnimatePresence>
        {selectedBook && (
          <EBookReader
            book={selectedBook}
            onClose={() => {
              setSelectedBook(null);
            }}
            onUpdateProgress={handleUpdateBookProgress}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onAddNote={handleAddNote}
          />
        )}
      </AnimatePresence>

      {/* Sticky Bottom Geometric Menubar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070001f0] backdrop-blur-lg border-t border-[#290205] px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {[
            { id: 'books' as const, label: 'eBooks', icon: BookOpen },
            { id: 'videos' as const, label: 'Videos', icon: Film },
            { id: 'blog' as const, label: 'Journal', icon: Newspaper },
            { id: 'reviews' as const, label: 'Critique', icon: MessageSquare },
            { id: 'membership' as const, label: 'Pact', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab(tab.id);
                }}
                className="flex flex-col items-center gap-1.5 p-1 transition-all relative focus:outline-none cursor-pointer"
              >
                <div className={`p-1.5 rounded-none transition-all duration-350 ${
                  isSelected ? 'text-red-400 bg-[#160204] border border-red-950/80 shadow-[0_0_10px_rgba(229,62,62,0.15)]' : 'text-[#6e585a] hover:text-red-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`font-mono text-[8px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isSelected ? 'text-red-350 font-bold' : 'text-[#6e585a]'
                }`}>
                  {tab.label}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="activeTabMarker"
                    className="absolute -top-[10px] w-6 h-[2.5px] bg-[#e53e3e] shadow-[0_0_8px_#ff0000]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
