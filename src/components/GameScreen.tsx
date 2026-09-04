import React, { useEffect, useState } from 'react';
import { Question, ThemeMode } from '../types';
import { soundEngine } from '../services/soundEngine';
import { Volume2, Sparkles, Lightbulb } from 'lucide-react';

interface Props {
  theme: ThemeMode;
  questions: Question[];
  onFinishGame: (score: number, correct: number, wrong: number) => void;
  onGoHome: () => void;
  onTriggerConfetti: () => void;
}

export const GameScreen: React.FC<Props> = ({
  theme,
  questions,
  onFinishGame,
  onGoHome,
  onTriggerConfetti,
}) => {
  const isDark = theme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(soundEngine.isSpeaking);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;

  // Listen to SoundEngine speech state changes
  useEffect(() => {
    const unsub = soundEngine.subscribeSpeech((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

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

    return () => {
      clearTimeout(timer);
      soundEngine.stopSpeaking();
    };
  }, [currentIndex, currentQ?.name]);

  // Handle showing next clue
  const handleShowNextClue = () => {
    if (!currentQ || currentClueIndex >= currentQ.clues.length - 1 || answered) return;
    soundEngine.playClue();
    const nextIdx = currentClueIndex + 1;
    setCurrentClueIndex(nextIdx);
    const nextClue = currentQ.clues[nextIdx];
    soundEngine.speak(nextClue);
  };

  // Check answer and speak result + educational fact
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
      
      const speechText = currentQ.fact 
        ? `أَحْسَنْتَ! إِجَابَةٌ صَحِيحَةٌ. ${currentQ.fact}`
        : "أَحْسَنْتَ! إِجَابَةٌ صَحِيحَةٌ";
      setTimeout(() => {
        soundEngine.speak(speechText);
      }, 150);
    } else {
      setWrongCount((prev) => prev + 1);
      soundEngine.playError();
      
      const speechText = currentQ.fact
        ? `الْإِجَابَةُ الصَّحِيحَةُ هِيَ: ${currentQ.answer}. ${currentQ.fact}`
        : `الْإِجَابَةُ الصَّحِيحَةُ هِيَ: ${currentQ.answer}`;
      setTimeout(() => {
        soundEngine.speak(speechText);
      }, 150);
    }
  };

  // Re-read educational fact directly
  const handleSpeakFact = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentQ || !currentQ.fact) return;
    soundEngine.playClick();
    soundEngine.speak(currentQ.fact);
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
    if (isLastQuestion) {
      soundEngine.stopSpeaking();
      onFinishGame(score, correctCount, wrongCount);
    } else {
      soundEngine.playClick();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const progressPct = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
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
          className={`border rounded-xl px-3 py-1 text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer shadow-xs ${
            isDark
              ? 'border-slate-700 hover:border-slate-500 bg-[#090e1c]/80 text-slate-300 hover:text-white'
              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900'
          }`}
        >
          ← رجوع
        </button>

        <div className="flex items-center gap-2">
          <div
            className={`border rounded-xl px-3 py-1 text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1 ${
              isDark
                ? 'bg-[#0c1324] border-slate-800 text-cyan-300'
                : 'bg-white border-slate-200 text-cyan-700'
            }`}
          >
            ⭐ <span id="score-display">{score}</span>
          </div>

          <div
            className={`border rounded-xl px-3 py-1 text-xs sm:text-sm font-bold shadow-xs ${
              isDark
                ? 'bg-[#0c1324] border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            سؤال <span id="q-num" className={isDark ? 'text-cyan-400' : 'text-cyan-600 font-extrabold'}>{currentIndex + 1}</span> / <span id="q-total">{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`rounded-full h-1.5 mb-3.5 overflow-hidden border ${
          isDark
            ? 'bg-slate-900 border-slate-800/80'
            : 'bg-slate-200 border-slate-300/80'
        }`}
      >
        <div
          id="progress-bar"
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Mystery Clues Box */}
      <div
        className={`rounded-2xl p-4 text-center mb-3.5 border transition-colors ${
          isDark
            ? 'bg-[#090e1d]/95 backdrop-blur-xs border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 backdrop-blur-xs border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span
            className={`flex items-center gap-1 font-semibold ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            من أنا؟ اقرأ التلميحات
          </span>
          <button
            onClick={handleRepeatClues}
            className={`text-[11px] font-semibold flex items-center gap-1 px-2.5 py-0.5 rounded-lg border cursor-pointer active:scale-95 transition-all ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border-slate-700'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
            }`}
            title="إعادة نطق التلميحات"
          >
            <Volume2 className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            استمع 🔊
          </button>
        </div>

        {/* Clues Container */}
        <div id="clues-container" className="space-y-2 mb-3">
          {currentQ.clues.slice(0, currentClueIndex + 1).map((clue, idx) => (
            <div
              key={idx}
              className={`rounded-xl py-2 px-3 text-sm sm:text-base text-right flex items-center gap-2 animate-slideDown shadow-xs border ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700/60 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                {idx + 1}
              </span>
              <span className="font-medium flex-1">{clue}</span>
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
              ? isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border-cyan-500/30 hover:border-cyan-400 active:scale-95 shadow-xs'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300 hover:border-cyan-400 active:scale-95 shadow-xs'
              : isDark
                ? 'bg-slate-900/40 text-slate-600 border-slate-800/60 opacity-50 cursor-not-allowed'
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
          }`}
        >
          {remainingClues > 0
            ? `تلميح آخر 💡 (${remainingClues} متبقٍ)`
            : 'كل التلميحات ظهرت'}
        </button>
      </div>

      {/* Choices Grid */}
      <p
        className={`text-center text-xs sm:text-sm font-bold mb-2 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        اختر الإجابة الصحيحة:
      </p>

      <div id="choices-grid" className="grid grid-cols-2 gap-2.5 max-w-[420px] mx-auto">
        {shuffledChoices.map((name, i) => {
          const isCorrect = name === currentQ.answer;
          const isSelected = selectedChoice === name;

          let cardStyle = isDark
            ? 'border-slate-800 bg-[#0c1324]/90 text-slate-200 hover:border-cyan-500/50 hover:bg-[#111a32] shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
            : 'border-slate-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50/40 shadow-[0_2px_12px_rgba(0,0,0,0.06)]';

          if (answered) {
            if (isCorrect) {
              cardStyle = isDark
                ? 'border-emerald-500/90 bg-emerald-950/50 text-emerald-200 font-bold scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-popIn'
                : 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-popIn';
            } else if (isSelected && !isCorrect) {
              cardStyle = isDark
                ? 'border-rose-500/90 bg-rose-950/50 text-rose-200 opacity-90 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-shake'
                : 'border-rose-500 bg-rose-50 text-rose-800 opacity-90 shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-shake';
            } else {
              cardStyle = isDark
                ? 'border-slate-850 bg-slate-950/40 opacity-40 text-slate-500'
                : 'border-slate-200 bg-slate-100 opacity-40 text-slate-400';
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
              <span className="text-5xl sm:text-6xl block leading-tight mb-1 drop-shadow-sm">
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
              ? isDark
                ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : isDark
                ? 'bg-rose-950/60 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
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

      {/* Educational Fact Card "هل تعلمت اليوم؟" */}
      {answered && currentQ.fact && (
        <div
          id="fact-card"
          onClick={handleSpeakFact}
          title="اضغط للاستماع للمعلومة بصوت عربي فصيح"
          className={`mt-3 rounded-2xl p-3.5 text-right animate-slideDown border transition-all cursor-pointer select-none group ${
            isSpeaking
              ? isDark
                ? 'bg-[#1e1b10] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/30'
                : 'bg-amber-100/90 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-2 ring-amber-400/40'
              : isDark
                ? 'bg-[#16140d]/95 hover:bg-[#1c190f] border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                : 'bg-amber-50/90 hover:bg-amber-100/70 border-amber-300 shadow-[0_2px_14px_rgba(245,158,11,0.12)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div
              className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-amber-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>هَلْ تَعَلَّمْتَ الْيَوْمَ؟</span>
            </div>

            {/* Listen / Replay Speech Button */}
            <button
              id="speak-fact-btn"
              onClick={handleSpeakFact}
              title="الاستماع للمعلومة بصوت نقي"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 shadow-xs ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black'
                  : isDark
                    ? 'bg-amber-950/70 group-hover:bg-amber-900/90 text-amber-200 border-amber-500/40'
                    : 'bg-amber-100 group-hover:bg-amber-200 text-amber-900 border-amber-300'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-slate-950' : 'text-amber-600'}`} />
              <span>{isSpeaking ? 'جاري القراءة 🎙️' : 'استمع 🔊'}</span>
            </button>
          </div>

          <div
            id="fact-text"
            className={`text-xs sm:text-sm leading-relaxed font-semibold pr-1 ${
              isDark ? 'text-amber-100/95' : 'text-amber-950'
            }`}
          >
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
