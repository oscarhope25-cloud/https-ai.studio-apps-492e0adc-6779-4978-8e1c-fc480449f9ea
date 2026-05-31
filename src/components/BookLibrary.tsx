import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, BookOpen, Clock, Lock, Sparkles, Upload, Tag, X, FileText, Check, ArrowDownToLine, Trash2, HelpCircle, Heart } from 'lucide-react';
import { Book, Subscription } from '../types';
import ReadingGoal from './ReadingGoal';

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-red-950/90 text-red-300 font-semibold px-0.5 rounded-[1px] select-none" style={{ textShadow: "0 0 3px rgba(239, 68, 68, 0.4)" }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

interface BookLibraryProps {
  books: Book[];
  subscription: Subscription;
  onSelectBook: (book: Book) => void;
  onAddBook: (book: Book) => void;
  onOpenPaywall: () => void;
  onAddTagToBook: (bookId: string, tag: string) => void;
  onRemoveTagFromBook: (bookId: string, tag: string) => void;
  onToggleDownloadBook: (bookId: string) => void;
  onToggleWishlistBook: (bookId: string) => void;
}

export default function BookLibrary({
  books,
  subscription,
  onSelectBook,
  onAddBook,
  onOpenPaywall,
  onAddTagToBook,
  onRemoveTagFromBook,
  onToggleDownloadBook,
  onToggleWishlistBook
}: BookLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'alphabetical'>('recent');
  
  // Custom tag creation states
  const [editingTagsBookId, setEditingTagsBookId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Simulated downloading states
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showSandboxNotice, setShowSandboxNotice] = useState(false);

  // Extract all unique tags
  const allTags = Array.from(new Set(books.flatMap(b => b.tags)));

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? b.tags.includes(selectedTag) : true;
    const matchesOffline = showOfflineOnly ? b.downloaded === true : true;
    const matchesWishlist = showWishlistOnly ? b.wishlisted === true : true;
    return matchesSearch && matchesTag && matchesOffline && matchesWishlist;
  });

  const sortedFilteredBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating ?? 0) - (a.rating ?? 0);
    } else if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title);
    } else {
      // Recent - sort by Date-now timestamp parsed from the ID
      const timestampA = parseInt(a.id.replace('book-', ''), 10);
      const timestampB = parseInt(b.id.replace('book-', ''), 10);
      if (!isNaN(timestampA) && !isNaN(timestampB)) {
        return timestampB - timestampA;
      }
      return b.id.localeCompare(a.id);
    }
  });



  // Triggering the Sandboxed download simulator
  const handleDownloadClick = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (downloadingBookId) return;

    setDownloadingBookId(bookId);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onToggleDownloadBook(bookId);
            setDownloadingBookId(null);
            setShowSandboxNotice(true);
          }, 400);
          return 100;
        }
        return prev + 15;
      });
    }, 100);
  };

  const handleRemoveDownload = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    onToggleDownloadBook(bookId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="book-library-root">
      
      {/* Interactive Daily Study Tracker */}
      <ReadingGoal />
      
      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search through silence (title, author)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070707] border border-red-950/40 focus:border-red-800 text-[#e0e0e0] focus:outline-none px-4 py-3 pl-11 rounded-none font-sans text-xs tracking-wider placeholder:text-[#555] transition-all"
          />
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-red-950/60" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting selection tool */}
          <div className="flex items-center gap-2 px-4 py-3 border border-red-950/40 bg-[#070707] font-mono text-[10px] tracking-widest uppercase text-zinc-500 rounded-none h-[42px]">
            <span className="text-[#555]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-red-400 outline-none cursor-pointer uppercase font-mono tracking-widest font-bold border-none p-0 focus:ring-0 focus:outline-none"
            >
              <option value="recent" className="bg-[#0c0c0c] text-[#cca]">Recent</option>
              <option value="rating" className="bg-[#0c0c0c] text-[#cca]">Rating</option>
              <option value="alphabetical" className="bg-[#0c0c0c] text-[#cca]">Alphabetical</option>
            </select>
          </div>

          {/* Offline only toggle */}
          <button
            onClick={() => setShowOfflineOnly(!showOfflineOnly)}
            className={`flex items-center gap-2 px-4 py-3 border font-mono text-[10px] tracking-widest uppercase transition-all rounded-none h-[42px] ${
              showOfflineOnly 
                ? 'border-red-700 bg-red-950/10 text-red-400' 
                : 'border-red-950/40 text-zinc-500 hover:border-red-900/40 hover:text-zinc-350'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${showOfflineOnly ? 'bg-red-500 animate-pulse shadow-[0_0_6px_#ff0000]' : 'bg-[#333]'}`}></span>
            <span>Offline Vault</span>
          </button>

          {/* Wishlist filter toggle */}
          <button
            onClick={() => setShowWishlistOnly(!showWishlistOnly)}
            className={`flex items-center gap-2 px-4 py-3 border font-mono text-[10px] tracking-widest uppercase transition-all rounded-none h-[42px] ${
              showWishlistOnly 
                ? 'border-red-700 bg-red-950/10 text-red-400' 
                : 'border-red-950/40 text-zinc-500 hover:border-red-900/40 hover:text-zinc-350'
            }`}
          >
            <Heart className={`h-3 w-3 ${showWishlistOnly ? 'fill-red-500 text-red-500 animate-pulse' : 'text-zinc-500'}`} />
            <span>Wishlist</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-red-950/30 pb-6">
        <span className="font-mono text-[10px] uppercase text-red-900/60 mr-2 flex items-center gap-1.5">
          <Filter className="h-3 w-3" />
          Filter tags:
        </span>
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1 text-xs transition-all font-mono rounded-none border ${
            selectedTag === null
              ? 'bg-red-950/30 border-red-750 text-red-400'
              : 'border-red-950/20 text-[#888] hover:border-red-950/80 hover:text-red-500'
          }`}
        >
          All Archive Logs
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`px-3 py-1 text-xs transition-all font-mono rounded-none border ${
              selectedTag === t
                ? 'bg-red-950/30 border-red-750 text-red-400'
                : 'border-[#141414] text-[#888] hover:border-red-950/80 hover:text-red-500'
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      {/* Sandboxed notice banner */}
      <AnimatePresence>
        {showSandboxNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-950/10 border border-red-900/30 flex items-start gap-3 rounded-none"
          >
            <HelpCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="font-sans text-xs text-[#e0e0e0] leading-relaxed">
              <span className="font-mono font-bold text-red-400 block uppercase tracking-wider mb-1">● SANDBOX STORAGE COMPLETED</span>
              The resource has been securely stored inside your local browser database sandbox. For anti-piracy protection and license compliance, direct device downloads are restricted. Fully responsive offline reading is active inside this application.
            </div>
            <button onClick={() => setShowSandboxNotice(false)} className="text-[#655] hover:text-white font-mono text-[10px] ml-auto uppercase tracking-wider">
              [ Dismiss ]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Grid */}
      {sortedFilteredBooks.length === 0 ? (
        <div className="text-center py-24 border border-red-950/20 bg-[#070707] rounded-none">
          <BookOpen className="mx-auto h-8 w-8 text-red-950/20 mb-3" />
          <p className="font-serif text-[#888] text-base italic">The archive is clear</p>
          <p className="text-xs text-[#555] font-mono mt-1 uppercase tracking-widest">Try broadening your request query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFilteredBooks.map((b) => {
            const isLocked = b.isPremium && !subscription.isActive;
            const isEditingThis = editingTagsBookId === b.id;

            return (
              <motion.div
                key={b.id}
                whileHover={{ y: -3 }}
                className="group relative bg-[#070707] border border-red-950/40 rounded-none p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden hover:border-red-900/60"
              >
                {/* Absolute Top Right Wishlist Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlistBook(b.id);
                  }}
                  className="absolute top-4 right-4 text-zinc-650 hover:text-red-500 hover:scale-110 transition duration-200 z-10 cursor-pointer p-1.5 rounded-none border border-transparent hover:border-red-950/20 bg-black/40"
                  title={b.wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart className={`h-3.5 w-3.5 transition-all ${b.wishlisted ? 'fill-red-650 text-red-500' : 'text-zinc-600'}`} />
                </button>

                {/* Main Card Layout - Flex Row for Book details */}
                <div className="flex gap-4 mb-4">
                  {/* Book Cover Design */}
                  <div 
                    onClick={() => {
                      if (isLocked) onOpenPaywall();
                      else onSelectBook(b);
                    }}
                    className="w-20 h-30 relative rounded-none overflow-hidden shrink-0 border border-red-950/40 bg-black cursor-pointer"
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={b.coverImage}
                      alt={b.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                    />
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/85 flex items-center justify-center">
                        <div className="bg-red-950/20 border border-red-900 p-1 rounded-none text-red-500 shadow">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Book Meta Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="relative">
                      {/* Active Tagging section representing robust user tag assignment */}
                      <div className="flex flex-wrap gap-1 mb-1.5 max-h-12 overflow-y-auto pr-1">
                        {b.tags.map((t, idx) => (
                          <span 
                            key={idx} 
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTagFromBook(b.id, t);
                            }}
                            className="group/tag font-mono text-[8px] text-[#777] hover:text-red-500 tracking-widest uppercase flex items-center gap-0.5 cursor-pointer"
                            title="Click to remove tag"
                          >
                            #{t}
                            <span className="opacity-0 group-hover/tag:opacity-100 text-red-650 text-[6px]">×</span>
                          </span>
                        ))}
                      </div>

                      <h3 
                        onClick={() => {
                          if (isLocked) onOpenPaywall();
                          else onSelectBook(b);
                        }}
                        className="font-serif italic text-white text-sm md:text-base leading-snug group-hover:text-red-400 transition duration-300 cursor-pointer line-clamp-2"
                      >
                        {highlightText(b.title, searchQuery)}
                      </h3>
                      <p className="font-sans text-[11px] text-[#777] truncate">
                        {highlightText(b.author, searchQuery)}
                      </p>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono">
                      {/* Robust tags inline assign button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditingThis) {
                            setEditingTagsBookId(null);
                          } else {
                            setEditingTagsBookId(b.id);
                            setNewTagInput('');
                          }
                        }}
                        className="text-red-950/80 hover:text-red-500 flex items-center gap-1 transition"
                        title="Assign new tag"
                      >
                        <Tag className="h-3 w-3" />
                        <span>Tag</span>
                      </button>

                      {/* Download toggle button */}
                      {b.downloaded ? (
                        <button
                          onClick={(e) => handleRemoveDownload(e, b.id)}
                          className="text-red-500 hover:text-red-600 flex items-center gap-1.5 transition uppercase font-bold text-[8px]"
                          title="Purge Offline Cache"
                        >
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_#ff0505]" />
                          Vault Copy
                        </button>
                      ) : downloadingBookId === b.id ? (
                        <span className="text-red-650 flex items-center gap-1 uppercase font-semibold text-[8px]">
                          Downloading {downloadProgress}%
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleDownloadClick(e, b.id)}
                          className="text-[#666] hover:text-red-500 flex items-center gap-1 transition-all"
                          title="Simulate Secure Offline Sync"
                        >
                          <ArrowDownToLine className="h-3 w-3" />
                          <span>Cache</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Tag Adding Panel */}
                <AnimatePresence>
                  {isEditingThis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-red-950/20 pt-2.5 mt-2 flex gap-1.5"
                    >
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagInput.trim()) {
                              onAddTagToBook(b.id, newTagInput.trim());
                              setNewTagInput('');
                            }
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1 bg-black border border-red-950/40 text-[10px] uppercase font-mono px-2 py-1 text-white focus:outline-none focus:border-red-900 rounded-none placeholder:text-[#333]"
                      />
                      <button
                        onClick={() => {
                          if (newTagInput.trim()) {
                            onAddTagToBook(b.id, newTagInput.trim());
                            setNewTagInput('');
                          }
                        }}
                        className="px-2 bg-red-950/20 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white font-mono text-[9px] uppercase rounded-none"
                      >
                        Add
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulated downloading bar inside card while active */}
                {downloadingBookId === b.id && (
                  <div className="w-full bg-red-950/10 h-[1.5px] rounded-none mt-2 relative overflow-hidden">
                    <div
                      className="bg-red-500 h-full absolute left-0 top-0 transition-all duration-100"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}

                {/* Progress bar info */}
                <div className="border-t border-red-950/10 pt-3 mt-3 flex justify-between items-center text-[9px] font-mono text-[#555] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {b.progress > 0 ? `${b.progress}% read` : 'uncut path'}
                  </span>
                  <span>{b.content.length}pg</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
