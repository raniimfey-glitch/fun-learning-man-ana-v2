import React from 'react';
import appIcon from '../assets/images/app_icon_game_1788193924099.jpg';

interface Props {
  onOpenAudioSettings?: () => void;
}

export const Header: React.FC<Props> = () => {
  return (
    <header className="bg-[#080e1c]/90 backdrop-blur-md border-b border-slate-800/90 py-3 px-4 text-center relative shadow-lg">
      <div className="inline-block bg-slate-800/80 rounded-full px-3.5 py-0.5 text-cyan-300 text-xs font-bold mb-1 tracking-wide shadow-xs border border-cyan-500/20">
        ✨ رنيم فاي | التّعليم الممتع ✨
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-0.5">
        <img
          src={appIcon}
          alt="أيقونة من أنا؟"
          referrerPolicy="no-referrer"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-cyan-400/40 shadow-[0_2px_10px_rgba(6,182,212,0.3)] object-cover"
        />
        <h1 className="text-white text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          من أنا؟
        </h1>
      </div>
      
      <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
        خمّن من التلميحات
      </p>
    </header>
  );
};
