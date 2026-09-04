import React, { useMemo } from 'react';
import { Sparkles, PartyPopper } from 'lucide-react';

interface Props {
  isDark: boolean;
}

export const TopBarConfetti: React.FC<Props> = ({ isDark }) => {
  // Pre-generate static positions for hardware-accelerated animated confetti in the top ribbon
  const ribbonPieces = useMemo(() => {
    const colors = [
      '#f59e0b', // Gold
      '#ef4444', // Ruby
      '#10b981', // Emerald
      '#06b6d4', // Cyan
      '#3b82f6', // Royal Blue
      '#8b5cf6', // Violet
      '#ec4899', // Hot Pink
      '#f97316', // Orange
    ];

    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i / 24) * 100 + (Math.sin(i * 1.7) * 2)}%`,
      color: colors[i % colors.length],
      size: 6 + ((i * 3) % 8),
      delay: (i * 0.15) % 2,
      duration: 1.8 + ((i * 0.2) % 1.6),
      isCircle: i % 3 === 0,
      isPill: i % 3 === 1,
    }));
  }, []);

  return (
    <div
      id="top-bar-confetti-ribbon"
      className="relative w-full overflow-hidden select-none"
    >
      {/* Moving Rainbow Gradient Border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 via-purple-500 via-cyan-400 to-emerald-400 animate-rainbowBar shadow-sm" />

      {/* Ribbon Body with Floating Confetti */}
      <div
        className={`relative py-1.5 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-black border-b transition-all overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-cyan-950/40 border-amber-500/30 text-amber-300'
            : 'bg-gradient-to-r from-amber-100/90 via-sky-100/90 to-emerald-100/90 border-amber-300/80 text-amber-950'
        }`}
      >
        {/* Animated Background Confetti Particles within the Top Bar */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {ribbonPieces.map((p) => (
            <span
              key={p.id}
              className="absolute top-1 inline-block animate-ribbonFloat"
              style={{
                left: p.left,
                width: p.isPill ? `${p.size * 1.8}px` : `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: p.isCircle ? '50%' : p.isPill ? '4px' : '2px',
                opacity: 0.85,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                boxShadow: `0 0 6px ${p.color}80`,
              }}
            />
          ))}
        </div>

        {/* Celebratory Foreground Content */}
        <div className="relative z-10 flex items-center justify-center gap-2 drop-shadow-xs">
          <PartyPopper className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="tracking-wide">
            🎉 مَبْرُوك! اكْتَمَلَتِ الْجَوْلَةُ بِنَجَاحٍ وَتَفَوُّقٍ! 🎊
          </span>
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
