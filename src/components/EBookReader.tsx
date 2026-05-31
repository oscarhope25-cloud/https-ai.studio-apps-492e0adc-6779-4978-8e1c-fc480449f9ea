import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Sliders, Type, FileText, Plus, X, List, Sparkles, PenTool } from 'lucide-react';
import { Book, BookNote } from '../types';

// Global utility helper to track page increments in active view frames
const incrementReadingGoalDirectly = (pages: number) => {
  const saved = localStorage.getItem('blackshadow_reading_goal');
  const todayStr = new Date().toISOString().split('T')[0];
  let currentGoal = {
    target: 20,
    current: 0,
    lastActiveDate: todayStr,
    streak: 0,
    completedTodayEnabled: false,
  };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        currentGoal = { ...currentGoal, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse goal from reader iframe:', e);
    }
  }

  if (currentGoal.lastActiveDate !== todayStr) {
    currentGoal.current = 0;
    currentGoal.lastActiveDate = todayStr;
    currentGoal.completedTodayEnabled = false;
  }

  const oldMet = currentGoal.current >= currentGoal.target;
  currentGoal.current += pages;
  const newMet = currentGoal.current >= currentGoal.target;

  if (!oldMet && newMet && currentGoal.target > 0) {
    currentGoal.streak += 1;
    currentGoal.completedTodayEnabled = true;
    window.dispatchEvent(new CustomEvent('readingGoalCelebrationTrigger'));
  }

  localStorage.setItem('blackshadow_reading_goal', JSON.stringify(currentGoal));
  window.dispatchEvent(new CustomEvent('readingGoalUpdated'));
};

interface EBookReaderProps {
  book: Book;
  onClose: () => void;
  onUpdateProgress: (bookId: string, progress: number, currentChapter: number) => void;
  onAddBookmark: (bookId: string, chapterIndex: number) => void;
  onRemoveBookmark: (bookId: string, chapterIndex: number) => void;
  onAddNote: (bookId: string, chapterIndex: number, text: string) => void;
}

export default function EBookReader({
  book,
  onClose,
  onUpdateProgress,
  onAddBookmark,
  onRemoveBookmark,
  onAddNote
}: EBookReaderProps) {
  // Reading visual options
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [themeTone, setThemeTone] = useState<'black' | 'charcoal' | 'sepia'>('black');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isChaptersOpen, setIsChaptersOpen] = useState(false);
  
  // Note creation
  const [noteInput, setNoteInput] = useState('');

  const currentChapter = book.currentChapter || 0;
  const isBookmarked = book.bookmarks?.includes(currentChapter);

  const handleNextPage = () => {
    if (currentChapter < book.content.length - 1) {
      const nextIdx = currentChapter + 1;
      const progress = Math.round((nextIdx / (book.content.length - 1)) * 100);
      onUpdateProgress(book.id, progress, nextIdx);
      // Automatically record one read chapter/page progression
      incrementReadingGoalDirectly(1);
    }
  };

  const handlePrevPage = () => {
    if (currentChapter > 0) {
      const prevIdx = currentChapter - 1;
      const progress = Math.round((prevIdx / (book.content.length - 1)) * 100);
      onUpdateProgress(book.id, progress, prevIdx);
    }
  };

  const handleToggleBookmark = () => {
    if (isBookmarked) {
      onRemoveBookmark(book.id, currentChapter);
    } else {
      onAddBookmark(book.id, currentChapter);
    }
  };

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteInput.trim()) {
      onAddNote(book.id, currentChapter, noteInput.trim());
      setNoteInput('');
    }
  };

  // Get current chapter notes
  const currentNotes = book.notes?.filter(n => n.chapterIndex === currentChapter) || [];

  // Theme Class Map
  const themeClasses = {
    black: 'bg-black text-[#e0e0e0] border-[#1a1a1a]',
    charcoal: 'bg-[#0a0a0a] text-[#888] border-[#1a1a1a]',
    sepia: 'bg-[#181512] text-[#d6c4ae] border-[#221f1c]'
  };

  const articleFontClasses = {
    sans: 'font-sans font-light tracking-wide',
    serif: 'font-serif font-normal leading-relaxed tracking-wide',
    mono: 'font-mono text-xs leading-relaxed text-[#888]'
  };

  const sizeClasses = {
    sm: 'text-xs md:text-sm',
    base: 'text-sm md:text-base',
    lg: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl'
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${themeClasses[themeTone]}`} id="ebook-reader-pane">
      {/* Top action header */}
      <header className="flex h-16 items-center justify-between px-4 md:px-8 border-b border-[#1a1a1a] relative z-25 bg-[#050505]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-[#666] hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-serif italic text-sm text-white line-clamp-1">{book.title}</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#666]">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsChaptersOpen(!isChaptersOpen)}
            className={`p-2 rounded-none text-[#666] hover:text-white transition-colors cursor-pointer ${isChaptersOpen ? 'bg-[#111] text-white' : ''}`}
            title="Index Chapters"
          >
            <List className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => {
              setIsNotesOpen(!isNotesOpen);
              setIsSettingsOpen(false);
            }}
            className={`p-2 rounded-none text-[#666] hover:text-white transition-colors cursor-pointer ${isNotesOpen ? 'bg-[#111] text-white' : ''}`}
            title="Reflective Journal"
          >
            <PenTool className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen);
              setIsNotesOpen(false);
            }}
            className={`p-2 rounded-none text-[#666] hover:text-white transition-colors cursor-pointer ${isSettingsOpen ? 'bg-[#111] text-white' : ''}`}
            title="Reader Layout"
          >
            <Sliders className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={handleToggleBookmark}
            className="p-2 text-[#666] hover:text-white transition-colors cursor-pointer"
            title={isBookmarked ? 'Clear page bookmark' : 'Bookmark this page'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4.5 w-4.5 text-white" />
            ) : (
              <Bookmark className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </header>

      {/* Main viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Chapters navigation slider */}
        <AnimatePresence>
          {isChaptersOpen && (
            <motion.div
              initial={{ x: -250, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -250, opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] z-30 p-4 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Chronicle Index</span>
                <button onClick={() => setIsChaptersOpen(false)} className="text-[#666] hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {book.content.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const progress = Math.round((idx / (book.content.length - 1)) * 100);
                      onUpdateProgress(book.id, progress, idx);
                      setIsChaptersOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-serif italic transition-colors rounded-none ${
                      idx === currentChapter
                        ? 'bg-[#1a1a1a] text-white font-bold'
                        : 'text-[#666] hover:bg-[#111] hover:text-white cursor-pointer'
                    }`}
                  >
                    Page {idx + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary visual content */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:py-16 md:px-12 flex justify-center items-start">
          <div className="max-w-xl w-full">
            
            {/* Page number */}
            <div className="flex justify-between items-center mb-6 border-b border-[#1a1a1a] pb-2">
              <span className="font-mono text-[10px] text-[#666] uppercase tracking-widest">
                MEMENTO LOG: Page {currentChapter + 1} / {book.content.length}
              </span>
              {isBookmarked && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-white bg-[#1a1a1a] px-2 py-0.5 rounded-none border border-[#333]">
                  ★ Bookmarked
                </span>
              )}
            </div>

            {/* Main book chapter block */}
            {book.pdfUrl ? (
              <div className="w-full h-[65vh] border border-red-950/30 bg-black flex flex-col">
                <iframe
                  src={book.pdfUrl}
                  title={book.title}
                  className="w-full h-full flex-grow rounded-none"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-[#050505] border-t border-red-955/20 p-2.5 text-center">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase">
                    CLOUD SECURE PDF PORTAL OPENED
                  </span>
                </div>
              </div>
            ) : (
              <motion.div
                key={currentChapter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`${articleFontClasses[fontFamily]} ${sizeClasses[fontSize]} whitespace-pre-wrap leading-relaxed tracking-wider`}
              >
                {book.content[currentChapter]}
              </motion.div>
            )}

            {/* Prev/Next buttons bottom bar */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#1a1a1a]">
              <button
                onClick={handlePrevPage}
                disabled={currentChapter === 0}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#1a1a1a] hover:border-[#333] rounded-none text-xs font-mono tracking-widest uppercase transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Prev Page
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentChapter === book.content.length - 1}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#1a1a1a] hover:border-[#333] rounded-none text-xs font-mono tracking-widest uppercase transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Next Page <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout Preferences Slider Drawer */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-[#050505] border-l border-[#1a1a1a] z-35 p-6 space-y-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Visual Preference</span>
                <button onClick={() => setIsSettingsOpen(false)} className="text-[#666] hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Typography selectors */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[#666]">Typeface Family</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['serif', 'sans', 'mono'] as const).map((fam) => (
                    <button
                      key={fam}
                      onClick={() => setFontFamily(fam)}
                      className={`py-1.5 text-xs uppercase font-mono rounded-none border transition cursor-pointer ${
                        fontFamily === fam
                          ? 'border-white bg-[#111] text-white'
                          : 'border-[#1a1a1a] text-[#888] hover:border-[#333]'
                      }`}
                    >
                      {fam}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Sizing selector */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[#666]">Sizing</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`py-1 text-xs uppercase font-mono rounded-none border transition cursor-pointer ${
                        fontSize === sz
                          ? 'border-white bg-[#111] text-white'
                          : 'border-[#1a1a1a] text-[#888] hover:border-[#333]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coloring presets */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[#666]">Atmosphere Tone</span>
                <div className="grid grid-cols-3 gap-1.5 font-sans text-xs">
                  {[
                    { key: 'black' as const, label: 'Noir' },
                    { key: 'charcoal' as const, label: 'Charcoal' },
                    { key: 'sepia' as const, label: 'Sepia' }
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => setThemeTone(preset.key)}
                      className={`py-1.5 rounded-none transition uppercase font-mono text-[9px] cursor-pointer ${
                        preset.key === 'black'
                          ? 'bg-black border border-[#1a1a1a] text-white'
                          : preset.key === 'charcoal'
                          ? 'bg-[#111] border border-[#1a1a1a] text-[#888]'
                          : 'bg-[#1e1a15] border border-[#221f1c] text-[#d6c4ae]'
                      } ${themeTone === preset.key ? 'border-white' : 'opacity-60'}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reflective thoughts Journal panel */}
        <AnimatePresence>
          {isNotesOpen && (
            <motion.div
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[#050505] border-l border-[#1a1a1a] z-35 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-3 mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Reflective Thoughts (Pg {currentChapter + 1})</span>
                  <button onClick={() => setIsNotesOpen(false)} className="text-[#666] hover:text-white cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* List current notes */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-4 pr-1">
                  {currentNotes.length === 0 ? (
                    <p className="text-[10px] font-mono text-[#666] text-center py-6 block leading-relaxed uppercase tracking-widest">
                      No philosophical impressions noted yet.
                    </p>
                  ) : (
                    currentNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-black border border-[#1a1a1a] rounded-none font-sans text-xs flex flex-col justify-between">
                        <p className="text-[#e0e0e0] leading-relaxed italic">"{note.text}"</p>
                        <span className="block font-mono text-[8px] text-[#666] uppercase mt-2">{note.createdAt}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compose new thought form */}
              <form onSubmit={handleCreateNoteSubmit} className="space-y-2.5">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Annotate your conceptual observation..."
                  rows={3}
                  className="w-full bg-black border border-[#1a1a1a] focus:border-white text-white text-xs px-3 py-2 focus:outline-none rounded-none font-sans leading-relaxed resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-white hover:bg-[#e0e0e0] text-black font-serif italic text-[10px] uppercase tracking-widest rounded-none transition cursor-pointer font-bold"
                >
                  Anchor Note
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Footer Slider Bar */}
      <footer className="h-10 border-t border-[#1a1a1a] px-6 flex items-center justify-between font-mono text-[9px] text-[#666] uppercase tracking-widest bg-[#050505]">
        <span>Progress: {book.progress}%</span>
        <div className="flex-1 max-w-sm mx-6 bg-[#111] h-[1px] rounded-none overflow-hidden">
          <div className="bg-white h-full transition-all duration-300" style={{ width: `${book.progress}%` }} />
        </div>
        <span>Sync Standard Offline</span>
      </footer>
    </div>
  );
}
