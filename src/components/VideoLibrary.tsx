import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, SkipForward, Clock, Lock, Sparkles, Film, ArrowLeft, Bookmark, Check, MessageSquare, ArrowDownToLine, Trash2, HelpCircle, X } from 'lucide-react';
import { Video, Subscription } from '../types';

interface VideoLibraryProps {
  videos: Video[];
  subscription: Subscription;
  onSelectVideo: (video: Video) => void;
  onOpenPaywall: () => void;
  onToggleDownloadVideo: (videoId: string) => void;
}

export default function VideoLibrary({
  videos,
  subscription,
  onSelectVideo,
  onOpenPaywall,
  onToggleDownloadVideo
}: VideoLibraryProps) {
  const [activePlayVideo, setActivePlayVideo] = useState<Video | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<{ [videoId: string]: { time: string; text: string }[] }>({});
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);

  // Simulated downloading states
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showSandboxNotice, setShowSandboxNotice] = useState(false);

  // Extract all video tags
  const allVideoTags = Array.from(new Set(videos.flatMap(v => v.tags)));

  const handlePlayVideo = (v: Video) => {
    const isLocked = v.isPremium && !subscription.isActive;
    if (isLocked) {
      onOpenPaywall();
    } else {
      setActivePlayVideo(v);
    }
  };

  const handleAddVideoNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlayVideo || !noteText.trim()) return;

    const newNote = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: noteText.trim()
    };

    setSavedNotes(prev => ({
      ...prev,
      [activePlayVideo.id]: [...(prev[activePlayVideo.id] || []), newNote]
    }));
    setNoteText('');
  };

  const filteredVideos = videos.filter(v => {
    const matchesTag = filterTag ? v.tags.includes(filterTag) : true;
    const matchesOffline = showOfflineOnly ? v.downloaded === true : true;
    return matchesTag && matchesOffline;
  });

  // Simulated download triggers
  const handleDownloadClick = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (downloadingVideoId) return;

    setDownloadingVideoId(videoId);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onToggleDownloadVideo(videoId);
            setDownloadingVideoId(null);
            setShowSandboxNotice(true);
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 120);
  };

  const handleRemoveDownload = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    onToggleDownloadVideo(videoId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="video-library-root">
      
      {/* Immersive Videoplayer section */}
      <AnimatePresence mode="wait">
        {activePlayVideo ? (
          <motion.div
            key="video-player-active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#070707] border border-red-950/45 rounded-none overflow-hidden mb-12 p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
          >
            <button
              onClick={() => setActivePlayVideo(null)}
              className="mb-6 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#666] hover:text-red-500 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Masterclasses
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Media viewport Column */}
              <div className="lg:col-span-8 space-y-4">
                <div className="aspect-video w-full bg-[#030303] border border-red-950/40 rounded-none overflow-hidden relative group">
                  
                  <video
                    src={activePlayVideo.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover opacity-100 transition duration-500"
                  />
                  
                  {/* Aesthetic visual loops overlay */}
                  <div className="absolute top-4 left-4 p-2 bg-black/95 backdrop-blur-sm rounded-none border border-red-955/20 pointer-events-none">
                    <span className="font-mono text-[7px] text-red-500 uppercase tracking-[0.25em] block font-bold flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-650 animate-pulse shadow-[0_0_6px_#ff0000]"></span>
                      TRANSMITTING ATMOSPHERIC STREAM
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
                  <div>
                    <h2 className="font-serif italic text-white text-xl md:text-2xl tracking-tight">{activePlayVideo.title}</h2>
                    <span className="font-mono text-[10px] text-red-700 uppercase tracking-[0.2em] block mt-1.5">
                      Duration: {activePlayVideo.duration} • Generative Shadow Vibe
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {activePlayVideo.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-black border border-red-950/40 text-[9px] font-mono text-[#888] uppercase rounded-none">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="font-sans text-xs text-[#888] leading-relaxed max-w-2xl pt-4 border-t border-red-950/20">
                  {activePlayVideo.description}
                </p>
              </div>

              {/* Video Notes Column */}
              <div className="lg:col-span-4 bg-black border border-red-950/40 rounded-none p-5 flex flex-col justify-between h-[450px]">
                <div>
                  <h3 className="font-serif italic text-white text-sm border-b border-red-950/40 pb-2 mb-4 flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-red-500" /> Lesson Notebook
                  </h3>
                  <div className="space-y-3.5 overflow-y-auto max-h-[280px] pr-1">
                    {(savedNotes[activePlayVideo.id] || []).length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="mx-auto text-red-950/30 h-6 w-6 mb-2" />
                        <p className="font-mono text-[8px] text-[#555] uppercase tracking-widest leading-relaxed">
                          Your thoughts regarding this visual chapter are archived physically in your sandbox ledger.
                        </p>
                      </div>
                    ) : (
                      (savedNotes[activePlayVideo.id] || []).map((note, i) => (
                        <div key={i} className="p-2.5 bg-[#0a0a0a] border border-red-950/20 rounded-none">
                          <div className="flex justify-between text-[8px] font-mono text-red-900/60 mb-1">
                            <span>NOTE JOURNAL</span>
                            <span>{note.time}</span>
                          </div>
                          <p className="text-xs text-zinc-350 font-sans italic">"{note.text}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submit note form */}
                <form onSubmit={handleAddVideoNote} className="space-y-2 mt-4 pt-3 border-t border-red-950/30">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Capture physical observation..."
                    className="w-full bg-[#0a0a0a] border border-red-950/40 focus:border-red-900 text-xs px-3 py-2 text-white focus:outline-none rounded-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-red-950/20 border border-red-900 text-red-400 hover:bg-red-900 hover:text-white font-serif text-[11px] uppercase italic tracking-widest rounded-none transition"
                  >
                    Commit Reflection
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="video-grid" className="space-y-6">
            
            {/* Grid Header and Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-red-950/30 pb-6 gap-4">
              <div>
                <span className="font-mono text-[10px] text-red-900/60 uppercase tracking-[0.4em] block mb-1">Animated Atmosphere masterclass</span>
                <h1 className="font-serif italic text-white text-2xl md:text-3xl tracking-tight">Atmospheric Channels</h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Offline filter toggle under videos section */}
                <button
                  onClick={() => setShowOfflineOnly(!showOfflineOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-[9px] tracking-widest uppercase transition-all rounded-none ${
                    showOfflineOnly 
                      ? 'border-red-750 bg-red-950/10 text-red-400' 
                      : 'border-red-950/30 text-[#888] hover:border-red-950/80 hover:text-red-500'
                  }`}
                >
                  <span className={`inline-block w-1.2 h-1.2 rounded-full ${showOfflineOnly ? 'bg-red-500 animate-pulse' : 'bg-[#333]'}`}></span>
                  <span>Offline Vault Only</span>
                </button>

                <button
                  onClick={() => setFilterTag(null)}
                  className={`px-3 py-1.5 rounded-none border text-[9px] uppercase font-mono tracking-widest transition-all ${
                    filterTag === null
                      ? 'bg-red-950/20 border-red-750 text-red-400'
                      : 'border-red-950/30 text-[#888] hover:border-red-950/80 hover:text-red-500'
                  }`}
                >
                  All Masterclasses
                </button>
                {allVideoTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`px-3 py-1.5 rounded-none border text-[9px] uppercase font-mono tracking-widest transition-all ${
                      filterTag === tag
                        ? 'bg-red-950/20 border-red-750 text-red-400'
                        : 'border-red-950/30 text-[#888] hover:border-red-950/80'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Sandboxed warning banner */}
            <AnimatePresence>
              {showSandboxNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-950/10 border border-red-900/30 flex items-start gap-3 rounded-none mb-6"
                >
                  <HelpCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="font-sans text-xs text-[#e0e0e0] leading-relaxed">
                    <span className="font-mono font-bold text-red-400 block uppercase tracking-wider mb-1">● SANDBOX MEDIA OFFLINE OK</span>
                    This movie has been securely integrated inside local application caching. Direct extraction to system storage or MP4 download is restricted due to licensing. Playback will run correctly under complete off-network conditions inside this module.
                  </div>
                  <button onClick={() => setShowSandboxNotice(false)} className="text-red-950/60 hover:text-white font-mono text-[9px] ml-auto uppercase">
                    [ Dismiss ]
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Bento grid */}
            {filteredVideos.length === 0 ? (
              <div className="text-center py-24 border border-red-950/20 bg-[#070707] rounded-none">
                <Film className="mx-auto h-8 w-8 text-red-950/20 mb-3" />
                <p className="font-serif text-[#888] text-base italic">No masterclasses saved offline</p>
                <p className="text-xs text-[#555] font-mono mt-1 uppercase tracking-widest">Cache lessons to review offline</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((v) => {
                  const isLocked = v.isPremium && !subscription.isActive;
                  return (
                    <motion.div
                      key={v.id}
                      whileHover={{ y: -3 }}
                      className="group bg-[#070707] border border-red-950/40 rounded-none overflow-hidden flex flex-col justify-between transition duration-300 hover:border-red-900/60"
                    >
                      {/* Video Image banner section */}
                      <div className="aspect-video relative overflow-hidden bg-black border-b border-red-950/40 flex items-center justify-center">
                        <img
                          referrerPolicy="no-referrer"
                          src={v.thumbnail}
                          alt={v.title}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:scale-105 transition duration-300">
                          {isLocked ? (
                            <button 
                              onClick={() => onOpenPaywall()}
                              className="p-3 bg-black/90 border border-red-950/60 rounded-none text-red-500"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePlayVideo(v)}
                              className="p-3 bg-red-950/40 border border-red-900 text-white rounded-none shadow-lg hover:bg-red-905 transition"
                            >
                              <Play className="h-4.5 w-4.5 fill-white" />
                            </button>
                          )}
                        </div>
                        <div className="absolute bottom-2.5 right-2.5 bg-black/95 border border-red-955/20 px-1.5 py-0.5 rounded-none text-[8px] font-mono text-[#888] tracking-widest">
                          {v.duration}
                        </div>

                        {isLocked && (
                          <div className="absolute top-2.5 left-2.5 bg-black/95 border border-red-955/25 px-2 py-0.5 rounded-none flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-red-500 animate-pulse" />
                            <span className="font-mono text-[8px] uppercase tracking-widest text-red-400">MEMBERSHIP PACT</span>
                          </div>
                        )}
                      </div>

                      {/* Metadata column description */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex gap-1.5 mb-2.5">
                            {v.tags.map(t => (
                              <span key={t} className="font-mono text-[8px] text-red-900/60 tracking-widest uppercase">
                                #{t}
                              </span>
                            ))}
                          </div>
                          <h3 
                            onClick={() => handlePlayVideo(v)}
                            className="font-serif italic text-white text-base leading-snug group-hover:text-red-400 transition duration-300 cursor-pointer line-clamp-2"
                          >
                            {v.title}
                          </h3>
                          <p className="font-sans text-xs text-[#888] mt-1.5 line-clamp-2 leading-relaxed">
                            {v.description}
                          </p>
                        </div>

                        {/* Sandbox download button in meta footer */}
                        <div className="pt-3 border-t border-red-950/20 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest">
                          {v.downloaded ? (
                            <button
                              onClick={(e) => handleRemoveDownload(e, v.id)}
                              className="text-red-400 hover:text-red-500 flex items-center gap-1.5 transition font-bold text-[8px]"
                              title="Delete local cache"
                            >
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_#ff0505]" />
                              VAULT COPY
                            </button>
                          ) : downloadingVideoId === v.id ? (
                            <span className="text-red-500 font-bold text-[8px]">
                              CACHING {downloadProgress}%
                            </span>
                          ) : (
                            <button
                              onClick={(e) => handleDownloadClick(e, v.id)}
                              className="text-[#666] hover:text-red-500 flex items-center gap-1 transition"
                              title="Secure Offline Storage Sync"
                            >
                              <ArrowDownToLine className="h-3 w-3" />
                              <span>SYNC VAULT</span>
                            </button>
                          )}

                          <button 
                            onClick={() => handlePlayVideo(v)}
                            className="text-red-800 hover:text-red-500 font-bold transition"
                          >
                            STREAM
                          </button>
                        </div>
                      </div>

                      {/* Intra-card progress animation bar */}
                      {downloadingVideoId === v.id && (
                        <div className="w-full bg-red-950/10 h-[1.5px] rounded-none mt-auto">
                          <div
                            className="bg-red-500 h-full transition-all duration-100"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
