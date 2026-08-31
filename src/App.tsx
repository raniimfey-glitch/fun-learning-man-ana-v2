/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * ================================================================================
 *   Project Name : التعليم الممتع | Fun Learning
 *   Version      : ألعاب تعليمية : من أنا - v2.5 (مع نظام صوتي ومعادل ذكي متطور)
 *   Developer    : Samira Abdessadok "رنيم فاي" | سميرة عبد الصّدوق
 *   Date         : جوان 2026
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
import { CategoryId, Question } from './types';
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

  return (
    <div className="min-h-screen bg-[#05070A] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] flex flex-col justify-between select-none text-slate-100 font-['Tajawal',sans-serif]">
      {/* Splash Screen */}
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => setCurrentScreen('categories')} />
      )}

      {/* Confetti Animation */}
      <Confetti triggerKey={confettiTrigger} />

      {/* Audio Settings & DSP Equalizer Modal */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      {/* Main Container */}
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Dynamic Screen Content */}
        <main className="flex-1 flex flex-col justify-center">
          {currentScreen === 'categories' && (
            <CategoriesScreen onSelectCategory={handleStartGame} />
          )}

          {currentScreen === 'game' && (
            <GameScreen
              questions={gameQuestions}
              onFinishGame={handleFinishGame}
              onGoHome={handleGoHome}
              onTriggerConfetti={triggerConfetti}
            />
          )}

          {currentScreen === 'end' && (
            <EndScreen
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
      <footer className="text-center py-4 px-3 text-xs sm:text-sm text-slate-500 border-t border-slate-800/80 mt-6 font-semibold tracking-wide bg-[#060a14]/60 backdrop-blur-xs">
        سميرة عبد الصّدوق &mdash; جميع الحقوق محفوظة &copy; 2026
      </footer>
    </div>
  );
}
