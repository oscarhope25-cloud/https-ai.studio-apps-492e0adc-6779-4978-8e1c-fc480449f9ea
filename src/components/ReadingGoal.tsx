import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Sparkles, Flame, Plus, RotateCcw, Check, BookOpen, AlertCircle } from 'lucide-react';

interface ReadingGoalData {
  target: number;
  current: number;
  lastActiveDate: string;
  streak: number;
  completedTodayEnabled: boolean;
}

export default function ReadingGoal() {
  const [goal, setGoal] = useState<ReadingGoalData>(() => {
    const saved = localStorage.getItem('blackshadow_reading_goal');
    const todayStr = new Date().toISOString().split('T')[0];

    if (saved) {
      try {
        const parsed: ReadingGoalData = JSON.parse(saved);
        // If it's a new day, reset daily progress but maintain target and streak!
        if (parsed.lastActiveDate !== todayStr) {
          // Check if yesterday they completed their goal to maintain streak
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const completedYesterday = parsed.current >= parsed.target && parsed.target > 0;
          let newStreak = parsed.streak;
          
          if (parsed.lastActiveDate === yesterdayStr) {
            newStreak = completedYesterday ? parsed.streak : 0;
          } else if (parsed.lastActiveDate !== todayStr) {
            // Missed a day or more
            newStreak = 0;
          }

          return {
            target: parsed.target || 20,
            current: 0,
            lastActiveDate: todayStr,
            streak: newStreak,
            completedTodayEnabled: false,
          };
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing reading goal', e);
      }
    }

    return {
      target: 20,
      current: 0,
      lastActiveDate: todayStr,
      streak: 0,
      completedTodayEnabled: false,
    };
  });

  const [inputVal, setInputVal] = useState<string>('');
  const [customTarget, setCustomTarget] = useState<string>(String(goal.target));
  const [showCelebration, setShowCelebration] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number; shape: string }[]>([]);

  // Synchronize state with storage
  useEffect(() => {
    localStorage.setItem('blackshadow_reading_goal', JSON.stringify(goal));
  }, [goal]);

  // Synchronize with external active reading sessions
  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('blackshadow_reading_goal');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setGoal(parsed);
        } catch (e) {
          console.error('Error parsing synced goal state:', e);
        }
      }
    };

    const handleCelebration = () => {
      triggerCelebrationParticles();
    };

    window.addEventListener('readingGoalUpdated', handleUpdate);
    window.addEventListener('readingGoalCelebrationTrigger', handleCelebration);
    
    return () => {
      window.removeEventListener('readingGoalUpdated', handleUpdate);
      window.removeEventListener('readingGoalCelebrationTrigger', handleCelebration);
    };
  }, []);

  // Handle page additions
  const handleAddPages = (pages: number) => {
    if (pages <= 0 || isNaN(pages)) return;

    setGoal(prev => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newCurrent = prev.current + pages;
      const targetMetBefore = prev.current >= prev.target;
      const targetMetNow = newCurrent >= prev.target;
      
      let newStreak = prev.streak;
      let shouldCelebrate = false;

      // If they just hit their target for the first time today
      if (!targetMetBefore && targetMetNow && prev.target > 0) {
        newStreak = prev.streak + 1;
        shouldCelebrate = true;
      }

      if (shouldCelebrate) {
        triggerCelebrationParticles();
      }

      return {
        ...prev,
        current: newCurrent,
        streak: newStreak,
        lastActiveDate: todayStr,
        completedTodayEnabled: targetMetNow
      };
    });

    setInputVal('');
  };

  const handleSetTarget = (newTarget: number) => {
    if (newTarget <= 0 || isNaN(newTarget)) return;

    setGoal(prev => {
      const targetMetBefore = prev.current >= prev.target;
      const targetMetNow = prev.current >= newTarget;
      let newStreak = prev.streak;

      // recalculate streak if they change target and trigger completion state
      if (!targetMetBefore && targetMetNow && prev.current > 0) {
        newStreak = prev.streak + 1;
        triggerCelebrationParticles();
      } else if (targetMetBefore && !targetMetNow) {
        newStreak = Math.max(0, prev.streak - 1);
      }

      return {
        ...prev,
        target: newTarget,
        streak: newStreak,
        completedTodayEnabled: targetMetNow
      };
    });
    
    setShowGoalForm(false);
  };

  const resetTodayProgress = () => {
    setGoal(prev => ({
      ...prev,
      current: 0,
      completedTodayEnabled: false,
      streak: prev.current >= prev.target ? Math.max(0, prev.streak - 1) : prev.streak
    }));
  };

  // Build colorful elegant cyber-confetti elements
  const triggerCelebrationParticles = () => {
    setShowCelebration(true);
    const colors = ['#dc2626', '#b91c1c', '#ffffff', '#e2e8f0', '#000000', '#7f1d1d', '#ef4444'];
    const shapes = ['circle', 'square', 'star', 'triangle'];
    const newConfetti = Array.from({ length: 90 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50, // relative to center
      y: Math.random() * 80 + 20, // push downwards/outwards
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.4,
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }));
    setConfetti(newConfetti);

    // Auto dismiss celebration panels after 4s
    setTimeout(() => {
      setShowCelebration(false);
    }, 4500);
  };

  // Math for Circular SVG progress dashboard
  const progressPercent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const isCompleted = goal.current >= goal.target;

  // Circle Dimensions
  const radius = 48;
  const stroke = 4.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div 
      className="w-full bg-[#070707] border border-red-950/40 p-5 md:p-6 mb-8 relative group font-sans select-none overflow-hidden" 
      id="reading-goal-tracker-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Absolute Geometric Visual Grid Highlights */}
      <div className="absolute top-0 right-0 p-1 font-mono text-[7px] text-red-950/40 select-none pointer-events-none">
        GOAL_SIGNAL_CORE_2.0
      </div>
      <div className="absolute bottom-0 right-0 w-[80px] h-[1px] bg-red-955/20 pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-[1px] h-[40px] bg-red-955/20 pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-center justify-between relative z-10 w-full">
        
        {/* LEFT COLUMN: Main title and details */}
        <div className="space-y-3 flex-grow text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <span className="w-2 h-2 rounded-none bg-red-600 animate-pulse" />
            <h2 className="font-serif italic text-[#e0e0e0] text-sm md:text-base tracking-widest flex items-center gap-1.5 uppercase">
              DAILY PROGRESSION COMPACT
            </h2>
            {goal.streak > 0 && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1 bg-[#120606] border border-red-950/50 text-red-500 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-none"
              >
                <Flame className="h-3 w-3 fill-red-800 text-red-500" />
                <span>{goal.streak} Day Book Streak</span>
              </motion.div>
            )}
          </div>

          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider max-w-md">
            Dedicate time to the archives. Read to keep your streak burning, compile your stats, and advance your intelligence matrix.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-zinc-650 uppercase mr-1">Increment:</span>
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => handleAddPages(num)}
                  className="px-2.5 py-1 bg-black border border-[#1a1a1a] hover:border-red-900/60 hover:text-white text-zinc-400 font-mono text-[9px] rounded-none cursor-pointer transition-all active:scale-95"
                >
                  +{num}p
                </button>
              ))}
            </div>

            {/* Manual input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const pages = parseInt(inputVal);
                if (pages > 0) handleAddPages(pages);
              }}
              className="flex items-center"
            >
              <input
                type="number"
                min="1"
                placeholder="Custom..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-16 bg-black border border-red-955/30 focus:border-red-900 focus:outline-none text-center font-mono text-[10px] py-1 text-white rounded-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900/40 border border-[#1a1a1a] text-red-400 hover:text-white font-mono text-[9px] uppercase tracking-widest rounded-none transition-colors border-l-0"
              >
                Log
              </button>
            </form>
          </div>
        </div>

        {/* MIDDLE COLUMN: Circular Progress Indicator */}
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center z-10 select-none">
          <div className="relative flex items-center justify-center shrink-0">
            {/* SVG Circular Indicator */}
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90 select-none filter drop-shadow-[0_0_8px_rgba(127,29,29,0.15)]"
            >
              {/* Outer Track circle */}
              <circle
                stroke="#111111"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="border border-[#141414]"
              />
              {/* Active animated progress stroke */}
              <motion.circle
                stroke={isCompleted ? "#dc2626" : "#7f1d1d"}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="square"
              />
            </svg>

            {/* Central Badge Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {isCompleted ? (
                <motion.div 
                  initial={{ scale: 0.8 }} 
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center justify-center"
                >
                  <Check className="h-5 w-5 text-red-500" />
                  <span className="font-mono text-[8px] text-red-400 uppercase tracking-widest leading-none mt-0.5 font-bold">MET</span>
                </motion.div>
              ) : (
                <div className="leading-none mt-1">
                  <span className="font-mono text-base font-bold text-white tracking-tighter block">{progressPercent}%</span>
                  <span className="font-mono text-[7px] text-zinc-500 uppercase tracking-widest leading-none">Ratio</span>
                </div>
              )}
            </div>
          </div>

          {/* Reading Target summary and custom config toggles */}
          <div className="text-center sm:text-left space-y-1">
            <div className="font-mono text-[10px] uppercase text-[#777] tracking-widest">
              Daily Target performance:
            </div>
            <div className="font-serif italic text-white text-lg font-medium">
              {goal.current} <span className="text-xs text-zinc-500 font-sans not-italic">/ {goal.target} Pages</span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
              {!showGoalForm ? (
                <button
                  type="button"
                  onClick={() => setShowGoalForm(true)}
                  className="text-red-900 hover:text-red-400 font-mono text-[9px] uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer hover:underline"
                >
                  [ Modify Daily Target ]
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-fadeIn">
                  <input
                    type="number"
                    min="1"
                    className="w-12 bg-black border border-red-955/35 focus:outline-none focus:border-red-900 text-center font-mono text-[9px] text-white py-0.5"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                  />
                  <button
                    onClick={() => handleSetTarget(parseInt(customTarget) || 20)}
                    className="px-2 bg-red-950/20 text-red-400 hover:text-white border border-[#1a1a1a] font-mono text-[8px] uppercase tracking-widest cursor-pointer py-0.5"
                  >
                    Set
                  </button>
                  <button
                    onClick={() => {
                      setShowGoalForm(false);
                      setCustomTarget(String(goal.target));
                    }}
                    className="text-zinc-650 hover:text-[#aaa] font-mono text-[8.5px] uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {goal.current > 0 && (
                <>
                  <span className="text-[#333] text-[9px] font-sans">•</span>
                  <button
                    type="button"
                    onClick={resetTodayProgress}
                    className="text-[#555] hover:text-red-500 font-mono text-[9px] uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer flex items-center gap-0.5"
                    title="Reset accumulated session progress for today"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* STUNNING CELEBRATORY SPARKS & CONFETTI OVERLAY */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none bg-black/45 backdrop-blur-[0.5px] flex items-center justify-center"
          >
            {/* Visual Particle Vortex */}
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: 0, 
                  y: 10, 
                  scale: 0.2, 
                  opacity: 1, 
                  rotate: 0 
                }}
                animate={{
                  x: particle.x * 6, // blast radius
                  y: [10, -particle.y, particle.y * 3], // arc height to floor fall
                  scale: [0.2, 1.2, 0.4],
                  opacity: [1, 1, 0],
                  rotate: [0, Math.random() * 360, Math.random() * 720]
                }}
                transition={{
                  duration: 3 + Math.random() * 1.5,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                className="absolute shadow-[0_0_4px_currentColor]"
                style={{
                  color: particle.color,
                  backgroundColor: particle.shape !== 'star' ? particle.color : 'transparent',
                  width: particle.size,
                  height: particle.size,
                  borderRadius: particle.shape === 'circle' ? '50%' : '0%',
                  clipPath: particle.shape === 'star' 
                    ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' 
                    : particle.shape === 'triangle' 
                    ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                    : 'none'
                }}
              />
            ))}

            {/* Central Celebration Announcement banner card */}
            <motion.div
              initial={{ scale: 0.85, y: 15, opacity: 0 }}
              animate={{ scale: [0.85, 1.05, 1], y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: -15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-[#030303] border border-red-950 p-6 max-w-sm text-center shadow-2xl relative"
            >
              <div className="absolute top-1 left-1 p-0.5 border border-red-950/40 font-mono text-[7px] text-[#555] uppercase select-none">
                TRIUMPH_DETECTION
              </div>
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 border border-red-900 bg-red-950/20 text-red-500 rounded-none flex items-center justify-center">
                  <Flame className="h-5 w-5 fill-red-850 animate-bounce" />
                </div>
              </div>
              
              <h3 className="font-serif italic text-white text-base mb-1 tracking-widest uppercase">
                GOAL ATTAINED
              </h3>
              <p className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest mb-3 animate-pulse">
                You have fulfilled your intellectual contract
              </p>
              
              <p className="font-sans text-[11px] text-zinc-300 leading-relaxed mb-4">
                Splendid. Today's progression core of <span className="font-mono text-red-500 font-bold">{goal.target} Pages</span> has been cataloged to your administrative metrics. Your streak count is now <span className="font-mono text-white text-[12px] p-1 bg-zinc-950 border border-zinc-900">{goal.streak} Days</span>.
              </p>

              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="w-full py-1.5 bg-red-950 hover:bg-red-900 text-white font-mono text-[9px] uppercase tracking-widest rounded-none border border-red-900 border-opacity-65 transition cursor-pointer"
              >
                Continue Archive Studies
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
