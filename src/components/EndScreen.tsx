import React, { useEffect } from 'react';
import { soundEngine } from '../services/soundEngine';

interface Props {
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  onReplay: () => void;
  onGoHome: () => void;
  onTriggerConfetti: () => void;
}

export const EndScreen: React.FC<Props> = ({
  score,
  maxScore,
  correct,
  wrong,
  onReplay,
  onGoHome,
  onTriggerConfetti,
}) => {
  const pct = maxScore > 0 ? score / maxScore : 0;

  let trophy = '🏆';
  let stars = '⭐⭐⭐';
  let title = 'ممتاز! أنت بطل الألغاز!';

  if (pct < 0.4) {
    trophy = '😊';
    stars = '⭐';
    title = 'تدرّب أكثر ستتحسن!';
  } else if (pct < 0.7) {
    trophy = '🥈';
    stars = '⭐⭐';
    title = 'جيد جداً! استمر!';
  }

  useEffect(() => {
    soundEngine.playFanfare();
    onTriggerConfetti();
    const timer = setTimeout(() => {
      soundEngine.speak(title);
    }, 400);
    return () => clearTimeout(timer);
  }, [title, onTriggerConfetti]);

  return (
    <div id="screen-end" className="py-8 px-4 text-center max-w-md mx-auto animate-fadeIn select-none">
      <div id="end-trophy" className="text-7xl sm:text-8xl mb-2 animate-bounce drop-shadow-md">
        {trophy}
      </div>
      <div id="end-stars" className="text-3xl mb-3 tracking-widest drop-shadow-sm">
        {stars}
      </div>
      <div id="end-title" className="text-xl sm:text-2xl font-black text-slate-100 mb-1.5 bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
        {title}
      </div>
      <div id="end-score" className="text-base sm:text-lg text-cyan-400 font-extrabold mb-1">
        نقاطك: {score} من {maxScore}
      </div>
      <div id="end-detail" className="text-xs sm:text-sm text-slate-400 font-semibold mb-6">
        ✅ إجابات صحيحة: {correct} &nbsp;&nbsp;|&nbsp;&nbsp; ❌ خاطئة: {wrong}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 max-w-[320px] mx-auto">
        <button
          id="replay-game-btn"
          onClick={() => {
            soundEngine.playClick();
            onReplay();
          }}
          className="flex-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl py-3 px-5 text-sm sm:text-base font-bold shadow-[0_4px_20px_rgba(6,182,212,0.25)] border border-cyan-400/30 active:scale-95 transition-all cursor-pointer"
        >
          العب مجدداً 🔄
        </button>

        <button
          id="end-home-btn"
          onClick={() => {
            soundEngine.playClick();
            onGoHome();
          }}
          className="flex-1 bg-[#0c1324] hover:bg-[#111a32] text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl py-3 px-5 text-sm sm:text-base font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          🏠 الرئيسية
        </button>
      </div>
    </div>
  );
};
