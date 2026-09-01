import React from 'react';
import { CategoryId, ThemeMode } from '../types';
import { soundEngine } from '../services/soundEngine';

interface Props {
  theme: ThemeMode;
  onSelectCategory: (cat: CategoryId) => void;
}

export const CategoriesScreen: React.FC<Props> = ({ theme, onSelectCategory }) => {
  const isDark = theme === 'dark';

  const categories: Array<{
    id: CategoryId;
    name: string;
    emoji: string;
    darkBorder: string;
    lightBorder: string;
    glowHover: string;
    dotColor: string;
  }> = [
    {
      id: 'animals',
      name: 'الحيوانات',
      emoji: '🦁',
      darkBorder: 'border-emerald-500/40 hover:border-emerald-400',
      lightBorder: 'border-emerald-400/60 hover:border-emerald-500',
      glowHover: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'jobs',
      name: 'المهن',
      emoji: '👨‍⚕️',
      darkBorder: 'border-purple-500/40 hover:border-purple-400',
      lightBorder: 'border-purple-400/60 hover:border-purple-500',
      glowHover: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      dotColor: 'bg-purple-500',
    },
    {
      id: 'fruits',
      name: 'فواكه وخضروات',
      emoji: '🍎',
      darkBorder: 'border-rose-500/40 hover:border-rose-400',
      lightBorder: 'border-rose-400/60 hover:border-rose-500',
      glowHover: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]',
      dotColor: 'bg-rose-500',
    },
    {
      id: 'school',
      name: 'البيئة المدرسية',
      emoji: '📚',
      darkBorder: 'border-amber-400/40 hover:border-amber-400',
      lightBorder: 'border-amber-400/70 hover:border-amber-500',
      glowHover: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'body',
      name: 'جسم الإنسان',
      emoji: '🫀',
      darkBorder: 'border-teal-500/40 hover:border-teal-400',
      lightBorder: 'border-teal-400/70 hover:border-teal-500',
      glowHover: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]',
      dotColor: 'bg-teal-500',
    },
    {
      id: 'transport',
      name: 'وسائل النقل',
      emoji: '🚗',
      darkBorder: 'border-blue-500/40 hover:border-blue-400',
      lightBorder: 'border-blue-400/70 hover:border-blue-500',
      glowHover: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      dotColor: 'bg-blue-500',
    },
  ];

  const handleSelect = (id: CategoryId) => {
    soundEngine.playClick();
    onSelectCategory(id);
  };

  return (
    <div id="screen-categories" className="py-6 px-3 sm:px-4 max-w-md mx-auto animate-fadeIn">
      <p
        className={`text-center text-sm sm:text-base font-bold mb-4 flex items-center justify-center gap-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        <span className={`w-8 h-[1px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
        اختر فئة للبدء
        <span className={`w-8 h-[1px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-[420px] mx-auto">
        {categories.map((cat) => (
          <div
            key={cat.id}
            id={`cat-card-${cat.id}`}
            onClick={() => handleSelect(cat.id)}
            className={`rounded-2xl p-5 text-center cursor-pointer border ${
              isDark
                ? `bg-[#0c1324]/90 backdrop-blur-xs ${cat.darkBorder} ${cat.glowHover} shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-[#111a32]`
                : `bg-white/95 backdrop-blur-xs ${cat.lightBorder} ${cat.glowHover} shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:bg-slate-50`
            } active:scale-95 transition-all duration-150 select-none relative group`}
          >
            <div className="absolute top-2.5 right-2.5">
              <span
                className={`w-2 h-2 rounded-full ${cat.dotColor} block opacity-70 group-hover:opacity-100 transition-opacity`}
              />
            </div>
            <span className="text-5xl sm:text-6xl block mb-2 leading-tight drop-shadow-sm group-hover:scale-105 transition-transform">
              {cat.emoji}
            </span>
            <span
              className={`text-sm sm:text-base font-bold transition-colors ${
                isDark
                  ? 'text-slate-100 group-hover:text-white'
                  : 'text-slate-800 group-hover:text-slate-950'
              }`}
            >
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      <button
        id="all-categories-btn"
        onClick={() => handleSelect('all')}
        className="w-full max-w-[420px] mx-auto mt-3.5 block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl p-3.5 text-base font-bold shadow-[0_4px_20px_rgba(6,182,212,0.25)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] border border-cyan-400/30 active:scale-98 transition-all cursor-pointer text-center"
      >
        🎲 العب بكل الفئات
      </button>
    </div>
  );
};
