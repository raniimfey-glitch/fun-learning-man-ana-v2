import React, { useEffect, useState, useMemo } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  bg: string;
  width: number;
  height: number;
  duration: number;
  delay: number;
  rotate: number;
  borderRadius: string;
}

interface Props {
  triggerKey: number;
  continuous?: boolean;
}

const COLORS = [
  '#f59e0b', // Gold
  '#ef4444', // Ruby
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Royal Blue
  '#8b5cf6', // Violet
  '#ec4899', // Hot Pink
  '#f97316', // Bright Orange
  '#eab308', // Yellow
  '#14b8a6', // Teal
];

export const Confetti: React.FC<Props> = ({ triggerKey, continuous = false }) => {
  const [burstPieces, setBurstPieces] = useState<ConfettiPiece[]>([]);

  // Continuous ambient confetti stream using pure CSS animations (zero re-render overhead)
  const continuousPieces = useMemo(() => {
    if (!continuous) return [];
    const pieces: ConfettiPiece[] = [];
    const count = 45; // Gentle ambient rain from top bar

    for (let i = 0; i < count; i++) {
      const isRibbon = i % 3 === 0;
      const isCircle = i % 3 === 1;
      const w = isRibbon ? 6 + (i % 5) : 7 + (i % 6);
      const h = isRibbon ? 12 + (i % 8) : w;

      pieces.push({
        id: i,
        left: (i * 2.2 + (Math.sin(i * 1.5) * 1.5)) % 100,
        bg: COLORS[i % COLORS.length],
        width: Math.round(w),
        height: Math.round(h),
        duration: 3.5 + (i % 4) * 0.8,
        delay: (i * 0.18) % 4,
        rotate: (i * 47) % 360,
        borderRadius: isCircle ? '50%' : isRibbon ? '2px' : '3px',
      });
    }
    return pieces;
  }, [continuous]);

  // Handle burst celebration wave
  useEffect(() => {
    if (triggerKey === 0) return;

    const generated: ConfettiPiece[] = [];
    const count = 100; // Dense celebration shower

    for (let i = 0; i < count; i++) {
      const isRibbon = Math.random() > 0.45;
      const isCircle = !isRibbon && Math.random() > 0.5;
      const w = isRibbon ? 6 + Math.random() * 6 : 8 + Math.random() * 8;
      const h = isRibbon ? 14 + Math.random() * 12 : w;

      generated.push({
        id: Date.now() + i + Math.random(),
        left: Math.random() * 100,
        bg: COLORS[Math.floor(Math.random() * COLORS.length)],
        width: Math.round(w),
        height: Math.round(h),
        duration: 2.0 + Math.random() * 2.0,
        delay: Math.random() * 0.8,
        rotate: Math.floor(Math.random() * 360),
        borderRadius: isCircle ? '50%' : isRibbon ? '2px' : '3px',
      });
    }

    setBurstPieces(generated);

    const timer = setTimeout(() => {
      setBurstPieces([]);
    }, 4500);

    return () => clearTimeout(timer);
  }, [triggerKey]);

  if (burstPieces.length === 0 && continuousPieces.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden select-none"
    >
      {/* Continuous Ambient Falling Confetti from the Top Bar */}
      {continuousPieces.map((p) => (
        <div
          key={`cont-${p.id}`}
          className="absolute -top-6 animate-confettiInfinite will-change-transform opacity-80"
          style={{
            left: `${p.left}vw`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.bg,
            borderRadius: p.borderRadius,
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
            transform: `rotate(${p.rotate}deg)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Immediate Celebratory Burst Confetti */}
      {burstPieces.map((p) => (
        <div
          key={p.id}
          className="absolute -top-8 animate-confettiFall will-change-transform"
          style={{
            left: `${p.left}vw`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.bg,
            borderRadius: p.borderRadius,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            transform: `rotate(${p.rotate}deg)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

