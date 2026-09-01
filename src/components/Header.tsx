import React from 'react';
import { ThemeMode } from '../types';
import appIcon from '../assets/images/app_icon_game_1788193924099.jpg';
import { Sun, Moon, Sliders, WifiOff } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface Props {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAudioSettings: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<Props> = ({
  theme,
  onToggleTheme,
  onOpenAudioSettings,
  isOnline = true,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      id="main-header"
      className={`py-3 px-3 sm:px-4 text-center relative border-b transition-colors duration-300 ${
        isDark
          ? 'bg-[#080e1c]/90 backdrop-blur-md border-slate-800/90 shadow-lg'
          : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 mb-1.5">
        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={() => {
            soundEngine.playClick();
            onToggleTheme();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
            isDark
              ? 'bg-slate-850 hover:bg-slate-800 text-amber-300 border-amber-400/30 hover:border-amber-400/60 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-slate-400 shadow-xs'
          }`}
          title={isDark ? 'التبديل إلى الوضع النهاري (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
          aria-label="تبديل المظهر"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>الوضع النهاري ☀️</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>الوضع الليلي 🌙</span>
            </>
          )}
        </button>

        {/* Center Developer & Brand Pill */}
        <div
          className={`hidden sm:inline-block rounded-full px-3 py-0.5 text-xs font-bold tracking-wide border transition-colors ${
            isDark
              ? 'bg-slate-800/90 text-cyan-300 border-cyan-500/20 shadow-xs'
              : 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-xs'
          }`}
        >
          ✨ رنيم فاي | التّعليم الممتع ✨
        </div>

        {/* Audio DSP Settings Button */}
        <button
          id="audio-settings-header-btn"
          onClick={() => {
            soundEngine.playClick();
            onOpenAudioSettings();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
            isDark
              ? 'bg-slate-850 hover:bg-slate-800 text-cyan-300 border-cyan-500/30 hover:border-cyan-400/60 shadow-xs'
              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300 shadow-xs'
          }`}
          title="معادل الصوت الذكي والنظام الصوتي المتطور"
          aria-label="إعدادات الصوت"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-500" />
          <span>الصوت والمعادل</span>
        </button>
      </div>

      {/* Mobile-only brand badge */}
      <div className="sm:hidden mb-1">
        <div
          className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wide border transition-colors ${
            isDark
              ? 'bg-slate-800/90 text-cyan-300 border-cyan-500/20'
              : 'bg-cyan-50 text-cyan-800 border-cyan-300'
          }`}
        >
          ✨ رنيم فاي | التّعليم الممتع ✨
        </div>
      </div>

      {/* App Logo & Title */}
      <div className="flex items-center justify-center gap-2 mt-0.5">
        <img
          src={appIcon}
          alt="أيقونة من أنا؟"
          referrerPolicy="no-referrer"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-cyan-400/40 shadow-[0_2px_10px_rgba(6,182,212,0.25)] object-cover"
        />
        <h1
          className={`text-xl sm:text-2xl font-black tracking-tight ${
            isDark
              ? 'bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent'
              : 'text-slate-900'
          }`}
        >
          من أنا؟
        </h1>
        
        {/* Offline Badge if disconnected */}
        {!isOnline && (
          <span
            className="flex items-center gap-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full"
            title="التطبيق يعمل بدون إنترنت"
          >
            <WifiOff className="w-2.5 h-2.5" />
            بدون إنترنت
          </span>
        )}
      </div>

      <p
        className={`text-xs sm:text-sm font-medium mt-0.5 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        خمّن من التلميحات
      </p>
    </header>
  );
};
