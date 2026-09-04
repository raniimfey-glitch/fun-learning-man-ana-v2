import React, { useEffect, useState, useRef } from 'react';
import { soundEngine } from '../services/soundEngine';
import { ThemeMode } from '../types';
import { Sparkles, Trophy, RotateCcw, Home, PartyPopper } from 'lucide-react';

interface Props {
  theme: ThemeMode;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  onReplay: () => void;
  onGoHome: () => void;
  onTriggerConfetti: () => void;
}

export const EndScreen: React.FC<Props> = ({
  theme,
  score,
  maxScore,
  correct,
  wrong,
  onReplay,
  onGoHome,
  onTriggerConfetti,
}) => {
  const isDark = theme === 'dark';
  const pct = maxScore > 0 ? score / maxScore : 0;
  const [cheerCount, setCheerCount] = useState(0);

  let trophyEmoji = '🏆';
  let stars = '⭐⭐⭐';
  let title = 'ممتاز! أنت بطل الألغاز!';
  let speechEncouragement = 'أَحْسَنْتَ يَا بَطَل! مَبْرُوكْ، أَنْتَ بَطَلُ الْأَلْغَازِ الْحَقِيقِيّ!';

  if (pct < 0.4) {
    trophyEmoji = '😊';
    stars = '⭐';
    title = 'تدرّب أكثر ستتحسن!';
    speechEncouragement = 'أَحْسَنْتَ الْمُحَاوَلَةَ يَا شُجَاع! مَعَ التَّدْرِيبِ سَتُصْبِحُ بَطَلاً خَارِقاً!';
  } else if (pct < 0.7) {
    trophyEmoji = '🥈';
    stars = '⭐⭐';
    title = 'جيد جداً! استمر!';
    speechEncouragement = 'رَائِعٌ جِدّاً! لَقَدْ حَقَّقْتَ نَتِيجَةً مُمَيَّزَةً، أَحْسَنْتَ!';
  }

  const onTriggerConfettiRef = useRef(onTriggerConfetti);
  onTriggerConfettiRef.current = onTriggerConfetti;

  const speechRef = useRef(speechEncouragement);
  speechRef.current = speechEncouragement;

  // Play celebration cheering + applause and launch confetti strictly once on mount
  useEffect(() => {
    // 1. Immediately cut off any previous question speech
    soundEngine.stopSpeaking();

    // 2. Play realistic cheering, applause, and fanfare celebration
    soundEngine.playCheersAndApplause();

    // 3. Trigger celebratory confetti bursts (decoupled with timeouts to avoid render phase setState collisions)
    const wave1 = setTimeout(() => {
      onTriggerConfettiRef.current();
    }, 150);

    const wave2 = setTimeout(() => {
      onTriggerConfettiRef.current();
    }, 1500);

    // 4. Voice encouragement spoken warmly after fanfare introduction
    const timer = setTimeout(() => {
      soundEngine.speak(speechRef.current);
    }, 1100);

    return () => {
      clearTimeout(wave1);
      clearTimeout(wave2);
      clearTimeout(timer);
      soundEngine.stopSpeaking();
    };
  }, []);

  // Re-trigger celebration cheer & applause manually
  const handleTriggerCelebrationAgain = () => {
    soundEngine.stopSpeaking();
    soundEngine.playCheersAndApplause();
    onTriggerConfetti();
    setCheerCount((c) => c + 1);
    setTimeout(() => {
      soundEngine.speak(speechEncouragement);
    }, 900);
  };

  return (
    <div
      id="screen-end"
      className="py-6 px-3 sm:px-4 text-center max-w-md mx-auto animate-fadeIn select-none"
    >
      {/* Celebration Header Card */}
      <div
        className={`relative rounded-3xl p-6 pt-0 border transition-all duration-300 shadow-xl overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-[#0e172d] to-[#070b16] border-cyan-500/30 shadow-[0_10px_35px_rgba(6,182,212,0.15)]'
            : 'bg-gradient-to-b from-white to-sky-50/70 border-sky-200 shadow-[0_10px_35px_rgba(14,165,233,0.12)]'
        }`}
      >
        {/* Animated Moving Confetti Top Bar Ribbon */}
        <div className="relative -mx-6 mb-5 overflow-hidden border-b border-amber-400/30 shadow-xs select-none">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 via-purple-500 via-cyan-400 to-emerald-400 animate-rainbowBar" />
          <div
            className={`py-2 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-black relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-amber-950/50 via-purple-950/60 to-cyan-950/50 text-amber-300'
                : 'bg-gradient-to-r from-amber-100/90 via-sky-100/90 to-emerald-100/90 text-amber-950'
            }`}
          >
            {/* 14 Animated Fluttering Confetti Elements across the Top Ribbon */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {[
                { left: '4%', bg: '#f59e0b', delay: 0.1, size: 8, isCircle: true },
                { left: '12%', bg: '#ef4444', delay: 0.5, size: 7, isCircle: false },
                { left: '20%', bg: '#10b981', delay: 0.9, size: 9, isCircle: true },
                { left: '28%', bg: '#06b6d4', delay: 0.3, size: 8, isCircle: false },
                { left: '38%', bg: '#ec4899', delay: 1.1, size: 7, isCircle: true },
                { left: '48%', bg: '#8b5cf6', delay: 0.7, size: 9, isCircle: false },
                { left: '58%', bg: '#f97316', delay: 0.2, size: 8, isCircle: true },
                { left: '68%', bg: '#eab308', delay: 1.3, size: 7, isCircle: false },
                { left: '76%', bg: '#14b8a6', delay: 0.4, size: 9, isCircle: true },
                { left: '84%', bg: '#3b82f6', delay: 0.8, size: 8, isCircle: false },
                { left: '92%', bg: '#f59e0b', delay: 1.2, size: 7, isCircle: true },
              ].map((p, i) => (
                <span
                  key={i}
                  className="absolute top-1.5 inline-block animate-ribbonFloat"
                  style={{
                    left: p.left,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.bg,
                    borderRadius: p.isCircle ? '50%' : '2px',
                    opacity: 0.85,
                    animationDelay: `${p.delay}s`,
                    boxShadow: `0 0 6px ${p.bg}99`,
                  }}
                />
              ))}
            </div>

            <PartyPopper className="w-4 h-4 text-amber-400 animate-bounce relative z-10" />
            <span className="tracking-wide relative z-10">
              🎊 لَوْحَةُ التَّحْفِيزِ وَالِاحْتِفَالِ بِالنَّجَاحِ 🎊
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse relative z-10" />
          </div>
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-20 bg-cyan-500/20 blur-2xl pointer-events-none rounded-full" />

        {/* Celebratory Banner Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black tracking-wide border mb-4 shadow-xs bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>اكْتَمَلَتِ الْجَوْلَةُ بِنَجَاحٍ!</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* Trophy / Medal with Bouncing Animation */}
        <div
          id="end-trophy"
          className="text-7xl sm:text-8xl mb-2 animate-bounce drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)] filter select-none"
          title="كأس الفوز"
        >
          {trophyEmoji}
        </div>

        {/* Star Rating */}
        <div
          id="end-stars"
          className="text-3xl sm:text-4xl mb-3 tracking-widest drop-shadow-md select-none"
        >
          {stars}
        </div>

        {/* Encouraging Title */}
        <h2
          id="end-title"
          className={`text-xl sm:text-2xl font-black mb-2 ${
            isDark
              ? 'bg-gradient-to-r from-white via-cyan-100 to-slate-200 bg-clip-text text-transparent drop-shadow-sm'
              : 'text-slate-900'
          }`}
        >
          {title}
        </h2>

        {/* Score & Points Highlight */}
        <div
          id="end-score"
          className={`text-lg sm:text-xl font-black mb-3 ${
            isDark ? 'text-cyan-300' : 'text-cyan-700'
          }`}
        >
          مجموع نقاطك: <span className="text-2xl font-black text-amber-400">{score}</span> من {maxScore}
        </div>

        {/* Statistics Pills */}
        <div className="grid grid-cols-2 gap-2.5 max-w-[280px] mx-auto mb-4">
          <div
            className={`rounded-2xl p-2.5 border text-xs font-bold shadow-xs ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            ✅ صحيحة: <span className="font-extrabold text-sm">{correct}</span>
          </div>
          <div
            className={`rounded-2xl p-2.5 border text-xs font-bold shadow-xs ${
              isDark
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            ❌ خاطئة: <span className="font-extrabold text-sm">{wrong}</span>
          </div>
        </div>

        {/* Interactive Cheer & Confetti Again Button */}
        <button
          id="re-cheer-btn"
          onClick={handleTriggerCelebrationAgain}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 shadow-sm ${
            isDark
              ? 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-200 border-cyan-500/40 hover:border-cyan-400'
              : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 hover:border-sky-400'
          }`}
          title="أعد إطلاق الكونفيتي وصوت التشجيع والتصفيق"
        >
          <PartyPopper className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>تشجيع وتصفيق وكونفيتي 🎉👏</span>
          {cheerCount > 0 && (
            <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
              +{cheerCount}
            </span>
          )}
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-[340px] mx-auto mt-5">
        <button
          id="replay-game-btn"
          onClick={() => {
            soundEngine.stopSpeaking();
            soundEngine.playClick();
            onReplay();
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl py-3 px-5 text-sm sm:text-base font-bold shadow-[0_4px_20px_rgba(6,182,212,0.25)] border border-cyan-400/30 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>العب مجدداً 🔄</span>
        </button>

        <button
          id="end-home-btn"
          onClick={() => {
            soundEngine.stopSpeaking();
            soundEngine.playClick();
            onGoHome();
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 px-5 text-sm sm:text-base font-bold shadow-xs active:scale-95 transition-all cursor-pointer border ${
            isDark
              ? 'bg-[#0c1324] hover:bg-[#111a32] text-slate-300 hover:text-white border-slate-700 hover:border-slate-500'
              : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 hover:border-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>🏠 الفئات</span>
        </button>
      </div>
    </div>
  );
};
