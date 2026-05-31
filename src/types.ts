export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  pdfUrl?: string; // Real PDF Storage URL
  content: string[]; // List of pages/chapters
  tags: string[];
  progress: number; // Percentage read 0-100
  currentChapter: number;
  bookmarks: number[]; // Chapter index bookmarks
  isPremium: boolean;
  notes: BookNote[];
  rating?: number;
  downloaded?: boolean;
  wishlisted?: boolean;
}

export interface BookNote {
  id: string;
  chapterIndex: number;
  text: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string; // Video URL template
  tags: string[];
  progress: number; // Percentage watched 0-100
  isPremium: boolean;
  description: string;
  downloaded?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  readingTime: string;
  tags: string[];
}

export interface Review {
  id: string;
  itemType: 'book' | 'video';
  itemId: string;
  itemTitle: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  likes: number;
  likedByUser?: boolean;
}

export interface Subscription {
  isActive: boolean;
  plan: 'monthly' | 'trimester' | null;
  trialStartDate?: string;
  trialEndDate?: string;
  expiresAt?: string;
}
