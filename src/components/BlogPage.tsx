import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Calendar, Clock, ArrowLeft, Bookmark, BookOpen, Share2, CheckCircle, Globe, ExternalLink } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogPageProps {
  posts: BlogPost[];
}

export default function BlogPage({ posts }: BlogPageProps) {
  const [blogMode, setBlogMode] = useState<'almanac' | 'portal'>('almanac');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [completedReads, setCompletedReads] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleToggleRead = (id: string) => {
    if (completedReads.includes(id)) {
      setCompletedReads(prev => prev.filter(item => item !== id));
    } else {
      setCompletedReads(prev => [...prev, id]);
    }
  };

  const handleShareClick = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="blog-page-root">
      {/* Sub-mode Tab Options within Journal section */}
      {!selectedPost && (
        <div className="flex border-b border-red-950/40 mb-8 pb-3 gap-6 justify-start">
          <button
            onClick={() => setBlogMode('almanac')}
            className={`font-mono text-[10px] uppercase tracking-widest pb-1 transition-all relative ${
              blogMode === 'almanac' ? 'text-red-400 border-b-2 border-red-500 font-bold' : 'text-[#8a5d62] hover:text-red-400'
            }`}
          >
            Almanac Logs
          </button>
          <button
            onClick={() => setBlogMode('portal')}
            className={`font-mono text-[10px] uppercase tracking-widest pb-1 transition-all relative flex items-center gap-1.5 ${
              blogMode === 'portal' ? 'text-red-400 border-b-2 border-red-500 font-bold' : 'text-[#8a5d62] hover:text-red-400'
            }`}
          >
            <Globe className="h-3 w-3 text-red-500" />
            <span>blackshadow.blog Live</span>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {blogMode === 'portal' && !selectedPost ? (
          <motion.div
            key="blog-portal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <span className="font-mono text-[10px] text-red-800 uppercase tracking-[0.4em] block mb-1">
                Direct Portal Gateway
              </span>
              <h1 className="font-serif italic text-red-100 text-3xl tracking-tight">
                Live Portal Connection
              </h1>
              <p className="font-sans text-xs text-[#b8979b] max-w-md mt-2.5 leading-relaxed">
                Seamless real-time synchronization with the master catalog directory. Explore Realms of Fear & Fantasy on the live server.
              </p>
            </div>

            {/* Direct Connect atmospheric action panel */}
            <div className="border border-red-950/60 bg-[#0d0103efe] p-6 text-center space-y-4 shadow-[0_4px_30px_rgba(20,1,3,0.5)]">
              <div className="mx-auto h-12 w-12 rounded-none bg-[#150205] border border-red-900 flex items-center justify-center text-red-500 font-serif logo-reflection">
                ★
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-400">double secure tunnel gateway</p>
                <p className="text-[#8a7073] text-[11px] leading-relaxed">
                  Browser sandboxes and iframe restrictions may block secure frames depending on your browser. For the absolute premium, responsive, and complete mobile reading experience, click below to open the portal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                <a
                  href="https://blackshadow.blog"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-[#b30e1d] hover:bg-[#d01c30] text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white transition-all rounded-none inline-flex items-center gap-2 border border-red-900 shadow-[0_0_15px_rgba(179,14,29,0.3)] hover:shadow-[0_0_20px_rgba(208,28,48,0.5)]"
                >
                  <span>Transmit Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Iframe preview container with background loading fallback */}
            <div className="border border-red-950/60 bg-black overflow-hidden relative" style={{ height: '700px' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 bg-[#0a0002]">
                <div className="text-red-900/60 font-mono text-[9px] tracking-widest animate-pulse uppercase">Syncing live web directory...</div>
              </div>
              <iframe
                src="https://blackshadow.blog"
                title="Black Shadow Blog Portal"
                className="w-full h-full border-none bg-transparent"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        ) : selectedPost ? (
          <motion.article
            key="blog-post-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Post return navigation */}
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#8a5d62] hover:text-red-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Almanac logs
            </button>

            {/* Post Header */}
            <div className="space-y-4 border-b border-red-950/40 pb-6">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-[#8a5d62]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-red-900" /> {selectedPost.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-900" /> {selectedPost.readingTime}
                </span>
              </div>
              <h1 className="font-serif italic text-red-200 text-3xl md:text-5xl tracking-tight leading-tight logo-reflection">
                {selectedPost.title}
              </h1>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedPost.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 bg-[#150205] border border-red-950/60 text-[9px] font-mono text-red-400/80 uppercase rounded-none">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Post Body: styled similarly to blackshadow.blog with high readability constraints */}
            <div className="font-serif text-[15px] md:text-lg text-[#efeff0] leading-relaxed max-w-2xl mx-auto whitespace-pre-line tracking-wide space-y-6">
              {selectedPost.content}
            </div>

            {/* Bottom panel actions */}
            <div className="border-t border-red-950/40 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleRead(selectedPost.id)}
                  className={`px-4 py-2 border text-xs font-mono tracking-widest uppercase transition-all rounded-none flex items-center gap-2 ${
                    completedReads.includes(selectedPost.id)
                      ? 'bg-transparent border-red-500 text-red-400'
                      : 'border-red-950/60 text-red-800/80 hover:border-red-500 hover:text-red-400'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{completedReads.includes(selectedPost.id) ? 'Archived as Read' : 'Complete Reading'}</span>
                </button>

                <button
                  onClick={handleShareClick}
                  className="px-4 py-2 border border-red-950/60 hover:border-red-500 text-xs font-mono tracking-widest uppercase text-red-800/80 hover:text-red-400 rounded-none flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{copiedLink ? 'Link Copied!' : 'Export Entry'}</span>
                </button>
              </div>

              <span className="font-mono text-[9px] text-[#8a5d62] uppercase tracking-[0.2em] leading-none">
                Blackshadow Philosophy Log
              </span>
            </div>
          </motion.article>
        ) : (
          <motion.div key="blog-index" className="space-y-12">
            {/* Title Header */}
            <div>
              <span className="font-mono text-[10px] text-red-800 uppercase tracking-[0.4em] block mb-1">
                Deep thought meditations
              </span>
              <h1 className="font-serif italic text-red-100 text-3xl tracking-tight leading-none logo-reflection">
                The Ledger of Solitude
              </h1>
              <p className="font-sans text-xs text-[#b8979b] max-w-md mt-2.5 leading-relaxed">
                Essays, literature analyses, and quiet-mind logs tracking the philosophical margins of the silent life.
              </p>
            </div>

            {/* Chronological Vertical post stack */}
            <div className="space-y-8 border-l border-red-950/40 pl-4 md:pl-8 ml-1">
              {posts.map((post) => {
                const isRead = completedReads.includes(post.id);
                return (
                  <motion.div
                    key={post.id}
                    className="relative group space-y-2 cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    {/* Time indicator square */}
                    <div className="absolute -left-[21px] md:-left-[37px] top-1.5 h-2 w-2 bg-[#1b0306] group-hover:bg-red-500 transition-colors border border-red-950/80 shadow-[0_0_5px_rgba(239,68,68,0.3)]" />

                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-[#8a5d62]">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readingTime}</span>
                      {isRead && (
                        <span className="text-red-400 bg-red-950/40 border border-red-900 px-1 py-0.5 font-bold rounded-none uppercase text-[8px] tracking-widest">read</span>
                      )}
                    </div>

                    <h2 className="font-serif italic text-red-100 text-lg md:text-xl group-hover:text-red-450 transition-colors leading-snug">
                      {post.title}
                    </h2>

                    <p className="font-sans text-xs md:text-sm text-[#b8979b] leading-relaxed max-w-2xl">
                      {post.excerpt}
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                       <span className="font-mono text-[9px] uppercase tracking-widest text-red-800 group-hover:text-red-400 transition duration-300">
                        Continue meditation
                      </span>
                      <span className="w-6 h-[1px] bg-red-950/30 group-hover:w-12 group-hover:bg-red-550 transition-all duration-300" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
