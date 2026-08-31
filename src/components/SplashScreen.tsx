import React, { useEffect, useState } from 'react';
import appIcon from '../assets/images/app_icon_game_1788193924099.jpg';

interface Props {
  onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setHide(true);
    }, 2100);

    const timer2 = setTimeout(() => {
      onFinish();
    }, 2700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      id="splash"
      className={`fixed inset-0 z-[9999] bg-[#05070A] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center transition-all duration-600 ease-out select-none ${
        hide ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative mb-3 group">
        {/* Ambient Back Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
        
        {/* App Icon */}
        <img
          src={appIcon}
          alt="من أنا؟ - أيقونة التطبيق"
          referrerPolicy="no-referrer"
          className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.6)] border-2 border-cyan-400/40 object-cover transform hover:scale-105 transition-transform duration-300 animate-bounce"
        />
      </div>

      <div className="text-white text-2xl sm:text-3xl font-black mt-2 text-center tracking-wide bg-gradient-to-r from-white via-cyan-100 to-slate-200 bg-clip-text text-transparent drop-shadow-sm">
        من أنا؟
      </div>
      <div className="text-cyan-400 text-sm sm:text-base font-medium mt-1">
        خمّن الشخصية من التلميحات
      </div>
      
      <div className="mt-5 bg-slate-900/90 backdrop-blur-xs rounded-full px-5 py-1.5 text-cyan-300 text-xs sm:text-sm font-bold tracking-wide shadow-sm border border-cyan-500/30">
        ✨ رنيم فاي | التّعليم الممتع ✨
      </div>

      <div className="flex gap-2 mt-8">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/40 animate-pulse" />
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/70 animate-pulse [animation-delay:0.2s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse [animation-delay:0.4s]" />
      </div>
    </div>
  );
};
