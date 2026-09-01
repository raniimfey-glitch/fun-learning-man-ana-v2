/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * ================================================================================
 *   Project Name : التعليم الممتع | Fun Learning
 *   Version      : ألعاب تعليمية : من أنا - v2.6 (الوضع الليلي والنهاري + دعم كامل للأوفلاين)
 *   Developer    : Samira Abdessadok "رنيم فاي" | سميرة عبد الصّدوق
 *   Date         : 2026
 * ================================================================================
 *   Copyright (c) 2026 Samira Abdessadok "رنيم فاي". All Rights Reserved.
 *   جميع الحقوق محفوظة © 2026 سميرة عبد الصّدوق "رنيم فاي".
 * ================================================================================
 */

import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { CategoriesScreen } from './components/CategoriesScreen';
import { GameScreen } from './components/GameScreen';
import { EndScreen } from './components/EndScreen';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { Confetti } from './components/Confetti';
import { GAME_DATA } from './data/gameData';
import { CategoryId, Question, ThemeMode } from './types';
import { soundEngine } from './services/soundEngine';

type ScreenState = 'splash' | 'categories' | 'game' | 'end';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Theme Management (Dark / Light mode) with persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('man_ana_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore
    }
    return 'dark';
  });

  // Apply theme to document & body
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.body.className = theme;
    
    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#080e1c' : '#ffffff');
    }

    try {
      localStorage.setItem('man_ana_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Web Audio on any initial interaction
  useEffect(() => {
    const handleInitialUserGesture = () => {
      soundEngine.initAudioContext();
    };

    window.addEventListener('click', handleInitialUserGesture, { once: true });
    window.addEventListener('touchstart', handleInitialUserGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleInitialUserGesture);
      window.removeEventListener('touchstart', handleInitialUserGesture);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStartGame = (cat: CategoryId) => {
    setSelectedCategory(cat);
    let pool: Question[] = [];
    if (cat === 'all') {
      pool = Object.values(GAME_DATA).flat();
    } else {
      pool = [...(GAME_DATA[cat] || [])];
    }

    // Shuffle and pick up to 10 questions
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setGameQuestions(selected);
    setMaxScore(selected.length * 4);
    setCurrentScreen('game');
  };

  const handleFinishGame = (score: number, correct: number, wrong: number) => {
    setFinalScore(score);
    setCorrectAnswers(correct);
    setWrongAnswers(wrong);
    setCurrentScreen('end');
  };

  const handleReplay = () => {
    if (selectedCategory) {
      handleStartGame(selectedCategory);
    } else {
      setCurrentScreen('categories');
    }
  };

  const handleGoHome = () => {
    soundEngine.stopSpeaking();
    setCurrentScreen('categories');
  };

  const triggerConfetti = () => {
    setConfettiTrigger(Date.now());
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between select-none transition-colors duration-300 font-['Tajawal',sans-serif] ${
        isDark
          ? 'bg-[#05070A] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] text-slate-100'
          : 'bg-[#f8fafc] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(241,245,249,0.6))] text-slate-900'
      }`}
    >
      {/* Splash Screen */}
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => setCurrentScreen('categories')} />
      )}

      {/* Confetti Animation */}
      <Confetti triggerKey={confettiTrigger} />

      {/* Audio Settings & DSP Equalizer Modal */}
      <AudioSettingsModal
        theme={theme}
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      {/* Main Container */}
      <div className="w-full flex-1 flex flex-col">
        {/* Header with Theme Toggle and Equalizer Buttons */}
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAudioSettings={() => setIsAudioModalOpen(true)}
          isOnline={isOnline}
        />

        {/* Dynamic Screen Content */}
        <main className="flex-1 flex flex-col justify-center">
          {currentScreen === 'categories' && (
            <CategoriesScreen
              theme={theme}
              onSelectCategory={handleStartGame}
            />
          )}

          {currentScreen === 'game' && (
            <GameScreen
              theme={theme}
              questions={gameQuestions}
              onFinishGame={handleFinishGame}
              onGoHome={handleGoHome}
              onTriggerConfetti={triggerConfetti}
            />
          )}

          {currentScreen === 'end' && (
            <EndScreen
              theme={theme}
              score={finalScore}
              maxScore={maxScore}
              correct={correctAnswers}
              wrong={wrongAnswers}
              onReplay={handleReplay}
              onGoHome={handleGoHome}
              onTriggerConfetti={triggerConfetti}
            />
          )}
        </main>
      </div>

      {/* Copyright Footer */}
      <footer
        className={`text-center py-4 px-3 text-xs sm:text-sm border-t mt-6 font-semibold tracking-wide backdrop-blur-xs transition-colors ${
          isDark
            ? 'text-slate-500 border-slate-800/80 bg-[#060a14]/60'
            : 'text-slate-500 border-slate-200 bg-white/70 shadow-xs'
        }`}
      >
        سميرة عبد الصّدوق &mdash; جميع الحقوق محفوظة &copy; 2026
      </footer>
    </div>
  );
}
