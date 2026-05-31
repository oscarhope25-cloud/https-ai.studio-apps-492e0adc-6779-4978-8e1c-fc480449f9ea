import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Plus, Check, Heart, X, Search, Filter } from 'lucide-react';
import { Review, Book, Video } from '../types';

interface ReviewPageProps {
  reviews: Review[];
  books: Book[];
  videos: Video[];
  onAddReview: (review: Review) => void;
  onLikeReview: (reviewId: string) => void;
}

export default function ReviewPage({
  reviews,
  books,
  videos,
  onAddReview,
  onLikeReview
}: ReviewPageProps) {
  const [filterType, setFilterType] = useState<'all' | 'book' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // Form compose states
  const [reviewType, setReviewType] = useState<'book' | 'video'>('book');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState('');

  // Auto select first item id on toggle type
  React.useEffect(() => {
    if (reviewType === 'book' && books.length > 0) {
      setSelectedItemId(books[0].id);
    } else if (reviewType === 'video' && videos.length > 0) {
      setSelectedItemId(videos[0].id);
    }
  }, [reviewType, books, videos]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !authorName.trim() || !comment.trim()) {
      setValidationError('Please populate all available fields.');
      return;
    }

    const matchedTitle = reviewType === 'book'
      ? books.find(b => b.id === selectedItemId)?.title || 'eBook'
      : videos.find(v => v.id === selectedItemId)?.title || 'Video';

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      itemType: reviewType,
      itemId: selectedItemId,
      itemTitle: matchedTitle,
      author: authorName.trim(),
      rating: rating,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      likedByUser: false
    };

    onAddReview(newReview);
    setIsComposing(false);
    
    // Reset compose inputs
    setAuthorName('');
    setComment('');
    setRating(5);
    setValidationError('');
  };

  const filteredReviews = reviews.filter(r => {
    const matchesType = filterType === 'all' ? true : r.itemType === filterType;
    const matchesSearch = r.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" id="review-center-root">
      
      {/* Title Header with Action Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="font-mono text-[10px] text-red-800 uppercase tracking-[0.4em] block mb-1">Affiliated Critique Hub</span>
          <h1 className="font-serif italic text-red-100 text-3xl tracking-tight leading-none logo-reflection">Community Reviews</h1>
        </div>

        <button
          onClick={() => setIsComposing(true)}
          className="px-4 py-2 bg-[#b30e1d] text-white font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 rounded-none transition hover:bg-[#d01c30] border border-red-900 shadow-[0_0_15px_rgba(179,14,29,0.3)] cursor-pointer"
        >
          <Plus className="h-4 w-4 text-white" /> Write Critique
        </button>
      </div>

      {/* Review composer modal layer */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.98 }}
              className="bg-[#0b0102] border border-red-950 p-6 rounded-none w-full max-w-xl shadow-[0_4px_30px_rgba(20,1,3,0.6)] space-y-4 text-[#efeff0]"
            >
              <div className="flex justify-between items-center border-b border-red-950/60 pb-3">
                <span className="font-serif italic text-lg text-red-100 logo-reflection">Draft Custom Critique</span>
                <button onClick={() => setIsComposing(false)} className="text-[#8a5d62] hover:text-red-400 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {validationError && (
                <p className="text-xs text-red-500 font-mono text-center">{validationError}</p>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Select Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1">Manifest Category</label>
                    <select
                      value={reviewType}
                      onChange={(e) => setReviewType(e.target.value as 'book' | 'video')}
                      className="w-full bg-[#050505] border border-[#1a1a1a] text-xs px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#333]"
                    >
                      <option value="book">eBook Catalogue</option>
                      <option value="video">Animated Video Cast</option>
                    </select>
                  </div>
                  {/* Select Item based on type */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1">Target Project</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1a1a1a] text-xs px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#333]"
                    >
                      {reviewType === 'book' ? (
                        books.map(b => (
                          <option key={b.id} value={b.id}>{b.title}</option>
                        ))
                      ) : (
                        videos.map(v => (
                          <option key={v.id} value={v.id}>{v.title}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Scribe author name */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-red-800 mb-1">Scribes Alias</label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="SolitaryReader"
                      className="w-full bg-[#110103] border border-red-950 focus:border-red-650 text-xs px-3 py-2 text-[#efeff0] focus:outline-none rounded-none font-sans"
                    />
                  </div>
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-red-800 mb-1">Index Core Rating</label>
                    <div className="flex gap-1.5 pt-1.5 items-center">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className="text-red-950 hover:text-red-400 transition cursor-pointer"
                        >
                          <Star className={`h-4.5 w-4.5 ${num <= rating ? 'text-red-500 fill-red-800' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Critiques Comment field */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-red-800 mb-1">Observations Comment</label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide a critical reflective synthesis regarding this masterclass or literary composition..."
                    className="w-full bg-[#110103] border border-red-950 focus:border-red-650 text-xs px-3 py-2 text-[#efeff0] focus:outline-none rounded-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-red-950/60">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-4 py-2 border border-red-950/80 text-xs text-[#8a5d62] hover:text-red-400 font-mono uppercase rounded-none cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#b30e1d] hover:bg-[#d01c30] text-white font-serif text-xs font-semibold uppercase rounded-none transition border border-red-900 shadow-[0_0_15px_rgba(179,14,29,0.3)] cursor-pointer font-serif italic"
                  >
                    Commit Critique
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and search controllers */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 font-mono">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter critiques by text context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-red-950/80 focus:border-red-650 text-[#efeff0] focus:outline-none px-4 py-3 pl-11 rounded-none font-sans text-xs tracking-wider"
          />
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-red-900" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-[#8a5d62] tracking-widest mr-2">Core:</span>
          {(['all', 'book', 'video'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-xs transition duration-300 font-mono rounded-none border cursor-pointer ${
                filterType === t
                  ? 'bg-red-950/40 text-red-400 border-red-900 font-bold'
                  : 'border-red-950/50 text-[#8a5d62] hover:border-red-700/60 hover:text-red-400'
              }`}
            >
              {t === 'all' ? 'All Archive' : t === 'book' ? 'eBooks' : 'Videos'}
            </button>
          ))}
        </div>
      </div>

      {/* Review Card layout list */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-20 border border-red-950/40 bg-[#0d0102efe] rounded-none">
          <MessageSquare className="mx-auto h-8 w-8 text-red-950/40 mb-3" />
          <p className="font-serif text-[#b8979b] text-base italic">The review manifest is dry</p>
          <p className="text-xs text-[#8a5d62] font-mono mt-1 uppercase tracking-widest">Be the first scribe to submit an impression!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0b0102de] border border-red-950/50 p-6 rounded-none flex flex-col justify-between hover:border-red-900/60 transition duration-300 relative shadow-[0_4px_30px_rgba(20,1,3,0.3)] hover:shadow-[0_4px_30px_rgba(150,15,30,0.15)]"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-red-950/45">
                  <div>
                    <span className="font-mono text-[9px] text-[#8a5d62] uppercase tracking-widest">
                      {r.itemType === 'book' ? 'eBook Critique' : 'Video Narrative'}
                    </span>
                    <h3 className="font-serif italic text-red-200 text-sm font-bold tracking-tight leading-tight mt-0.5">
                      {r.itemTitle}
                    </h3>
                  </div>

                  {/* Stars Representation */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= r.rating ? 'text-red-500 fill-red-850' : 'text-red-950/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="font-sans text-xs text-[#b8979b] leading-relaxed italic mb-6">
                  "{r.comment}"
                </p>
              </div>

              {/* Review Footer Card */}
              <div className="flex justify-between items-center text-[10px] font-mono border-t border-red-950/45 pt-4 text-[#8a5d62] uppercase tracking-wider">
                <div>
                  <span className="text-red-300 font-bold block">{r.author}</span>
                  <span className="text-[9px] text-red-900/80 mt-0.5 block">{r.date}</span>
                </div>

                {/* Interaction Button */}
                <button
                  onClick={() => onLikeReview(r.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 transition border rounded-none cursor-pointer ${
                    r.likedByUser
                      ? 'bg-transparent border-red-500 text-red-400'
                      : 'border-red-950/60 hover:border-red-500/60 text-[#8a5d62] hover:text-red-450'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${r.likedByUser ? 'fill-red-700 text-red-500' : ''}`} />
                  <span>{r.likes}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
