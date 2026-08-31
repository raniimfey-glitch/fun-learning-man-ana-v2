import React, { useEffect, useState } from 'react';
import { Question } from '../types';
import { soundEngine } from '../services/soundEngine';
import { Volume2, VolumeX, Sparkles, Lightbulb } from 'lucide-react';

interface Props {
  questions: Question[];
  onFinishGame: (score: number, correct: number, wrong: number) => void;
  onGoHome: () => void;
  onTriggerConfetti: () => void;
}

export const GameScreen: React.FC<Props> = ({
  questions,
  onFinishGame,
  onGoHome,
  onTriggerConfetti,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;

  // Initialize or load new question
  useEffect(() => {
    if (!currentQ) return;
    setCurrentClueIndex(0);
    setAnswered(false);
    setSelectedChoice(null);

    // Shuffle choices
    const shuffled = [...currentQ.choices].sort(() => Math.random() - 0.5);
    setShuffledChoices(shuffled);

    // Speak first clue with a slight delay
    const firstClue = currentQ.clues[0];
    const timer = setTimeout(() => {
      soundEngine.speak(firstClue);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentIndex, currentQ]);

  // Handle showing next clue
  const handleShowNextClue = () => {
    if (!currentQ || currentClueIndex >= currentQ.clues.length - 1 || answered) return;
    soundEngine.playClue();
    const nextIdx = currentClueIndex + 1;
    setCurrentClueIndex(nextIdx);
    const nextClue = currentQ.clues[nextIdx];
    soundEngine.speak(nextClue);
  };

  // Check answer
  const handleSelectChoice = (choiceName: string) => {
    if (answered || !currentQ) return;
    setAnswered(true);
    setSelectedChoice(choiceName);

    const isCorrect = choiceName === currentQ.answer;

    if (isCorrect) {
      const pts = Math.max(4 - currentClueIndex, 1);
      setScore((prev) => prev + pts);
      setCorrectCount((prev) => prev + 1);
      soundEngine.playSuccess();
      onTriggerConfetti();
      soundEngine.speak("أَحْسَنْتَ! إِجَابَةٌ صَحِيحَةٌ");
    } else {
      setWrongCount((prev) => prev + 1);
      soundEngine.playError();
      soundEngine.speak(`الْإِجَابَةُ الصَّحِيحَةُ هِيَ: ${currentQ.answer}`);
    }
  };

  // Re-read current clues
  const handleRepeatClues = () => {
    if (!currentQ) return;
    soundEngine.playClick();
    const clueText = currentQ.clues.slice(0, currentClueIndex + 1).join('. ');
    soundEngine.speak(clueText);
  };

  // Go to next question or end screen
  const handleNextQuestion = () => {
    soundEngine.playClick();
    if (isLastQuestion) {
      onFinishGame(score, correctCount, wrongCount);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const progressPct = ((currentIndex + 1) / questions.length) * 100;
  const remainingClues = currentQ ? currentQ.clues.length - 1 - currentClueIndex : 0;

  if (!currentQ) return null;

  return (
    <div id="screen-game" className="py-4 px-3 sm:px-4 max-w-md mx-auto animate-fadeIn">
      {/* Header controls & Score */}
      <div className="flex justify-between items-center mb-3 gap-2">
        <button
          id="game-back-home-btn"
          onClick={() => {
            soundEngine.playClick();
            soundEngine.stopSpeaking();
            onGoHome();
          }}
          className="border border-slate-700 hover:border-slate-500 bg-[#090e1c]/80 rounded-xl px-3 py-1 text-slate-300 hover:text-white text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          ← رجوع
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-[#0c1324] border border-slate-800 rounded-xl px-3 py-1 text-xs sm:text-sm font-bold text-cyan-300 shadow-xs flex items-center gap-1">
            ⭐ <span id="score-display">{score}</span>
          </div>

          <div className="bg-[#0c1324] border border-slate-800 rounded-xl px-3 py-1 text-xs sm:text-sm font-bold text-slate-300 shadow-xs">
            سؤال <span id="q-num" className="text-cyan-400">{currentIndex + 1}</span> / <span id="q-total">{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 rounded-full h-1.5 mb-3.5 overflow-hidden border border-slate-800/80">
        <div
          id="progress-bar"
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Mystery Clues Box */}
      <div className="bg-[#090e1d]/95 backdrop-blur-xs rounded-2xl p-4 text-center mb-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-slate-800">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2.5">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            من أنا؟ اقرأ التلميحات
          </span>
          <button
            onClick={handleRepeatClues}
            className="text-cyan-300 hover:text-cyan-200 text-[11px] font-semibold flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-0.5 rounded-lg border border-slate-700 cursor-pointer active:scale-95 transition-all"
            title="إعادة نطق التلميحات"
          >
            <Volume2 className="w-3 h-3 text-cyan-400" />
            استمع 🔊
          </button>
        </div>

        {/* Clues Container */}
        <div id="clues-container" className="space-y-2 mb-3">
          {currentQ.clues.slice(0, currentClueIndex + 1).map((clue, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-700/60 rounded-xl py-2 px-3 text-slate-100 text-sm sm:text-base text-right flex items-center gap-2 animate-slideDown shadow-xs"
            >
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                {idx + 1}
              </span>
              <span className="font-medium flex-1 text-slate-100">{clue}</span>
            </div>
          ))}
        </div>

        {/* Next Clue Button */}
        <button
          id="next-clue-btn"
          onClick={handleShowNextClue}
          disabled={remainingClues <= 0 || answered}
          className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
            remainingClues > 0 && !answered
              ? 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border-cyan-500/30 hover:border-cyan-400 active:scale-95 shadow-xs'
              : 'bg-slate-900/40 text-slate-600 border-slate-800/60 opacity-50 cursor-not-allowed'
          }`}
        >
          {remainingClues > 0
            ? `تلميح آخر 💡 (${remainingClues} متبقٍ)`
            : 'كل التلميحات ظهرت'}
        </button>
      </div>

      {/* Choices Grid */}
      <p className="text-center text-slate-300 text-xs sm:text-sm font-bold mb-2">
        اختر الإجابة الصحيحة:
      </p>

      <div id="choices-grid" className="grid grid-cols-2 gap-2.5 max-w-[420px] mx-auto">
        {shuffledChoices.map((name, i) => {
          const isCorrect = name === currentQ.answer;
          const isSelected = selectedChoice === name;

          let cardStyle = 'border-slate-800 bg-[#0c1324]/90 text-slate-200 hover:border-cyan-500/50 hover:bg-[#111a32] shadow-[0_4px_16px_rgba(0,0,0,0.3)]';
          if (answered) {
            if (isCorrect) {
              cardStyle = 'border-emerald-500/90 bg-emerald-950/50 text-emerald-200 font-bold scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-popIn';
            } else if (isSelected && !isCorrect) {
              cardStyle = 'border-rose-500/90 bg-rose-950/50 text-rose-200 opacity-90 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-shake';
            } else {
              cardStyle = 'border-slate-850 bg-slate-950/40 opacity-40 text-slate-500';
            }
          }

          return (
            <div
              key={name}
              id={`choice-card-${i}`}
              onClick={() => handleSelectChoice(name)}
              className={`rounded-2xl p-3 sm:p-4 text-center cursor-pointer border-[2px] transition-all duration-150 select-none ${cardStyle} ${
                !answered ? 'active:scale-95' : ''
              }`}
            >
              <span className="text-5xl sm:text-6xl block leading-tight mb-1 drop-shadow-md">
                {currentQ.emojis[name] || '❓'}
              </span>
              <span className="text-sm sm:text-base font-bold block">
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Result Message */}
      {answered && (
        <div
          id="result-msg"
          className={`mt-3 p-2.5 rounded-xl text-center text-sm sm:text-base font-bold animate-slideDown shadow-sm ${
            selectedChoice === currentQ.answer
              ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-rose-950/60 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
          }`}
        >
          {selectedChoice === currentQ.answer ? (
            <span>🎉 أحسنت! +{Math.max(4 - currentClueIndex, 1)} نقاط</span>
          ) : (
            <span>
              ❌ الإجابة: {currentQ.emojis[currentQ.answer]} {currentQ.answer}
            </span>
          )}
        </div>
      )}

      {/* Educational Fact Card "تعلّمت اليوم" */}
      {answered && currentQ.fact && (
        <div
          id="fact-card"
          className="mt-2.5 bg-[#16140d]/90 border border-amber-500/30 rounded-2xl p-3 text-right animate-slideDown shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        >
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            هل تعلمت اليوم؟
          </div>
          <div id="fact-text" className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
            {currentQ.fact}
          </div>
        </div>
      )}

      {/* Next Question Button */}
      {answered && (
        <button
          id="next-q-btn"
          onClick={handleNextQuestion}
          className="w-full max-w-[420px] mx-auto mt-3 block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl p-3 text-sm sm:text-base font-bold shadow-[0_4px_20px_rgba(6,182,212,0.25)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] border border-cyan-400/30 active:scale-98 transition-all cursor-pointer text-center animate-slideDown"
        >
          {isLastQuestion ? 'عرض النتيجة 🏆' : 'التالي ←'}
        </button>
      )}
    </div>
  );
};
