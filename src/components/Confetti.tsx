import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  bg: string;
  size: number;
  duration: number;
  delay: number;
  isCircle: boolean;
}

interface Props {
  triggerKey: number;
}

export const Confetti: React.FC<Props> = ({ triggerKey }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (triggerKey === 0) return;

    const colors = ['#0d9488', '#f43f5e', '#fbbf24', '#8b5cf6', '#10b981', '#3b82f6'];
    const newPieces: ConfettiPiece[] = [];

    for (let i = 0; i < 35; i++) {
      newPieces.push({
        id: Date.now() + i,
        left: Math.random() * 100,
        bg: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        duration: 1.2 + Math.random() * 0.8,
        delay: Math.random() * 0.3,
        isCircle: Math.random() > 0.5,
      });
    }

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [triggerKey]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute -top-4 animate-confettiFall"
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.bg,
            borderRadius: p.isCircle ? '50%' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
