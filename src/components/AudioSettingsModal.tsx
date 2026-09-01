import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../services/soundEngine';
import { EnvironmentMode, BassBoostLevel, ThemeMode } from '../types';
import { 
  X, Volume2, Sliders, Sparkles, Headphones, 
  Smartphone, Radio, ShieldCheck, Zap,
  Play, RotateCcw, Activity, Mic
} from 'lucide-react';

interface Props {
  theme: ThemeMode;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<Props> = ({ theme, isOpen, onClose }) => {
  const isDark = theme === 'dark';
  const [settings, setSettings] = useState(soundEngine.settings);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = soundEngine.subscribe(() => {
      setSettings({ ...soundEngine.settings });
    });
    return unsub;
  }, []);

  // Real-time Canvas Spectrum Visualizer
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = soundEngine.getAnalyserData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      if (data) {
        const barWidth = (canvas.width / (data.length / 2)) * 1.5;
        let x = 0;
        for (let i = 0; i < data.length / 2; i++) {
          const barHeight = (data[i] / 255) * (canvas.height - 8);

          // Color gradient from teal -> yellow -> pink
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#0d9488');
          grad.addColorStop(0.6, '#14b8a6');
          grad.addColorStop(1, '#fbbf24');

          ctx.fillStyle = grad;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);
          x += barWidth;
        }
      } else {
        // Idle ambient wave
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const time = Date.now() * 0.003;
        for (let i = 0; i < canvas.width; i += 4) {
          const y = canvas.height / 2 + Math.sin(time + i * 0.05) * 4;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnvChange = (env: EnvironmentMode) => {
    soundEngine.playClick();
    soundEngine.setEnvironment(env);
  };

  const handleBassLevelChange = (level: BassBoostLevel) => {
    soundEngine.playClick();
    soundEngine.setBassBoostLevel(level);
  };

  const handleVolumeChange = (val: number) => {
    soundEngine.updateSetting('volume', val);
  };

  const handleClarityChange = (val: number) => {
    soundEngine.updateSetting('vocalClarity', val);
  };

  const handleBassGainChange = (val: number) => {
    soundEngine.updateSetting('bassGain', val);
  };

  const handleTrebleGainChange = (val: number) => {
    soundEngine.updateSetting('trebleGain', val);
  };

  const handleRateChange = (val: number) => {
    soundEngine.updateSetting('ttsRate', val);
  };

  const toggleNoiseReduction = () => {
    soundEngine.playClick();
    soundEngine.updateSetting('noiseReduction', !settings.noiseReduction);
  };

  const toggleFreqEnhancer = () => {
    soundEngine.playClick();
    soundEngine.updateSetting('frequencyEnhancer', !settings.frequencyEnhancer);
  };

  const envOptions: Array<{ id: EnvironmentMode; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'auto', label: 'تلقائي ذكي', icon: <Zap className="w-4 h-4" />, desc: 'توازن مثالي ديناميكي' },
    { id: 'headphones', label: 'سماعات الرأس', icon: <Headphones className="w-4 h-4" />, desc: 'جهير عميق وتجسيم واسع' },
    { id: 'speaker', label: 'مكبر الهاتف', icon: <Smartphone className="w-4 h-4" />, desc: 'وضوح صوتي مضاعف' },
    { id: 'quiet', label: 'غرفة هادئة', icon: <Volume2 className="w-4 h-4" />, desc: 'دفء ونقاء متناسق' },
    { id: 'noisy', label: 'بيئة صاخبة', icon: <ShieldCheck className="w-4 h-4" />, desc: 'فلترة الضجيج ورفع النطق' },
    { id: 'studio', label: 'استوديو نقي', icon: <Sparkles className="w-4 h-4" />, desc: 'نقاء تفاصيل فائقة' },
  ];

  const bassLevels: Array<{ id: BassBoostLevel; label: string; gain: string }> = [
    { id: 'off', label: 'إيقاف', gain: '0dB' },
    { id: 'subtle', label: 'خفيف', gain: '+3dB' },
    { id: 'medium', label: 'متوسط', gain: '+7dB' },
    { id: 'deep', label: 'عميق', gain: '+10dB' },
    { id: 'ultra', label: 'فائق احترافي', gain: '+14dB' },
  ];

  return (
    <div 
      id="audio-settings-modal-backdrop"
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="audio-settings-modal"
        className={`rounded-2xl w-full max-w-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border overflow-hidden my-auto flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-[#080e1c] text-slate-100 border-slate-800'
            : 'bg-white text-slate-900 border-slate-200 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 flex items-center justify-between shadow-md border-b ${
            isDark
              ? 'bg-[#0c1426] border-slate-800 text-slate-100'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center backdrop-blur-xs shadow-inner ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700/80'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}
            >
              <Sliders className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2
                className={`text-base sm:text-lg font-black leading-tight ${
                  isDark
                    ? 'bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent'
                    : 'text-slate-900'
                }`}
              >
                النظام الصوتي ومعادل الصوت الذكي
              </h2>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                تحسين الترددات، تقليل الضجيج، وتضخيم الجهير
              </p>
            </div>
          </div>
          <button 
            id="audio-modal-close-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border active:scale-90 ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
            }`}
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className={`p-4 sm:p-5 overflow-y-auto space-y-5 divide-y ${
            isDark ? 'divide-slate-800/60' : 'divide-slate-200'
          }`}
        >
          
          {/* Visualizer & Status */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 shadow-inner">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                طيف الترددات الحية (Audio Spectrum)
              </span>
              <span className="bg-slate-900 text-cyan-300 px-2 py-0.5 rounded-full text-[10px] border border-slate-800">
                DSP 96kHz Processing
              </span>
            </div>
            <canvas 
              ref={canvasRef} 
              width={380} 
              height={56} 
              className="w-full h-14 rounded-lg bg-[#05070a] border border-slate-900 block" 
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850 text-[11px] text-slate-400">
              <span>تحسين الترددات: {settings.frequencyEnhancer ? 'مفعّل ✨' : 'معطل'}</span>
              <span>تقليل الضجيج: {settings.noiseReduction ? 'نشط 🛡️' : 'معطل'}</span>
              <span>الجهير: {settings.bassBoostLevel}</span>
            </div>
          </div>

          {/* 1. Environment Auto-Equalizer */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <Radio className="w-4 h-4 text-cyan-500" />
                معادل الصوت التلقائي (حسب بيئة المستخدم)
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                isDark ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' : 'text-cyan-800 bg-cyan-50 border-cyan-200'
              }`}>
                تكيّف فوري
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {envOptions.map((env) => {
                const active = settings.environmentMode === env.id;
                return (
                  <button
                    key={env.id}
                    id={`env-preset-${env.id}`}
                    onClick={() => handleEnvChange(env.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                        : isDark
                          ? 'bg-[#0c1426]/80 hover:bg-[#111c34] text-slate-200 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{env.label}</span>
                      <span className={active ? 'text-white' : 'text-cyan-500'}>{env.icon}</span>
                    </div>
                    <span className={`text-[10px] line-clamp-1 ${active ? 'text-cyan-100' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {env.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Professional Bass Boost Engine */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Zap className="w-4 h-4 text-amber-500" />
                  تضخيم الصوت الجهير الاحترافي (Bass Boost & Punch)
                </label>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  توليد توافقي للترددات المنخفضة وتجسيم عميق
                </p>
              </div>
              <button
                id="test-bass-btn"
                onClick={() => {
                  soundEngine.playBassTest();
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-transform cursor-pointer border ${
                  isDark
                    ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <Play className="w-3 h-3 fill-amber-500 text-amber-500" />
                اختبار الجهير
              </button>
            </div>

            {/* Bass Level Chips */}
            <div className="grid grid-cols-5 gap-1.5">
              {bassLevels.map((lvl) => {
                const active = settings.bassBoostLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    id={`bass-boost-${lvl.id}`}
                    onClick={() => handleBassLevelChange(lvl.id)}
                    className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : isDark
                          ? 'bg-[#0c1426] hover:bg-[#111c34] text-slate-300 border-slate-800 text-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 text-xs'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{lvl.label}</div>
                    <div className={`text-[9px] ${active ? 'text-amber-950 font-bold' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {lvl.gain}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine-tuning Bass Slider */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                isDark ? 'bg-[#0c1426] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-xs font-bold min-w-[75px] ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                معيار الجهير:
              </span>
              <input
                id="bass-gain-slider"
                type="range"
                min="0"
                max="12"
                step="1"
                value={settings.bassGain}
                onChange={(e) => handleBassGainChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg"
              />
              <span className={`text-xs font-bold min-w-[36px] text-left ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                +{settings.bassGain}dB
              </span>
            </div>
          </div>

          {/* 3. Clarity, Frequency Enhancer & Noise Reduction */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  تحسين نقاء الترددات وفلترة الضجيج
                </label>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  تنقية الصوت من الترددات المزعجة وإبراز مخارج الحروف
                </p>
              </div>
              <button
                id="test-clarity-btn"
                onClick={() => {
                  soundEngine.playClarityTest();
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-transform cursor-pointer border ${
                  isDark
                    ? 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40'
                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}
              >
                <Play className="w-3 h-3 fill-cyan-500 text-cyan-500" />
                اختبار النقاء
              </button>
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="toggle-noise-reduction-btn"
                onClick={toggleNoiseReduction}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-right cursor-pointer transition-all ${
                  settings.noiseReduction
                    ? isDark
                      ? 'bg-[#0d2035] border-cyan-500/60 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold shadow-xs'
                    : isDark
                      ? 'bg-[#0c1426] border-slate-800 text-slate-400 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${settings.noiseReduction ? 'text-cyan-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs">تقليل الضجيج المحيط</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>فلتر إزالة التشويش</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.noiseReduction ? 'bg-cyan-500 border-cyan-400 text-white' : isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                  {settings.noiseReduction && <span className="text-[10px] font-black">✓</span>}
                </div>
              </button>

              <button
                id="toggle-freq-enhancer-btn"
                onClick={toggleFreqEnhancer}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-right cursor-pointer transition-all ${
                  settings.frequencyEnhancer
                    ? isDark
                      ? 'bg-[#0d2035] border-cyan-500/60 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold shadow-xs'
                    : isDark
                      ? 'bg-[#0c1426] border-slate-800 text-slate-400 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${settings.frequencyEnhancer ? 'text-cyan-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs">مُعزز الترددات الفائقة</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>لمعان ونقاء بلوري</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.frequencyEnhancer ? 'bg-cyan-500 border-cyan-400 text-white' : isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                  {settings.frequencyEnhancer && <span className="text-[10px] font-black">✓</span>}
                </div>
              </button>
            </div>

            {/* Vocal Clarity Slider */}
            <div
              className={`p-2.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#0c1426] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <span className="flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-cyan-500" />
                  وضوح نطق الكلمات والتلميحات (Vocal Clarity):
                </span>
                <span className={isDark ? 'text-cyan-400 font-extrabold' : 'text-cyan-700 font-extrabold'}>
                  {settings.vocalClarity} / 10
                </span>
              </div>
              <input
                id="vocal-clarity-slider"
                type="range"
                min="1"
                max="10"
                step="1"
                value={settings.vocalClarity}
                onChange={(e) => handleClarityChange(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* Treble Shimmer Slider */}
            <div
              className={`p-2.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#0c1426] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <span>بريق الترددات العالية (Treble Air):</span>
                <span className={isDark ? 'text-cyan-400 font-extrabold' : 'text-cyan-700 font-extrabold'}>
                  +{settings.trebleGain}dB
                </span>
              </div>
              <input
                id="treble-gain-slider"
                type="range"
                min="0"
                max="10"
                step="1"
                value={settings.trebleGain}
                onChange={(e) => handleTrebleGainChange(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* 4. Master Volume & Speech Speed */}
          <div className="pt-4 space-y-3">
            <label className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <Volume2 className="w-4 h-4 text-cyan-500" />
              مستوى الصوت العام وسرعة النطق
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`p-2.5 rounded-xl border space-y-1.5 ${
                  isDark ? 'bg-[#0c1426] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span>مستوى الصوت الرئيسي:</span>
                  <span className={isDark ? 'text-cyan-400' : 'text-cyan-700'}>{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  id="master-volume-slider"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div
                className={`p-2.5 rounded-xl border space-y-1.5 ${
                  isDark ? 'bg-[#0c1426] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span>سرعة قراءة التلميحات:</span>
                  <span className={isDark ? 'text-cyan-400' : 'text-cyan-700'}>{settings.ttsRate}x</span>
                </div>
                <input
                  id="tts-rate-slider"
                  type="range"
                  min="0.6"
                  max="1.2"
                  step="0.05"
                  value={settings.ttsRate}
                  onChange={(e) => handleRateChange(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Test Speech Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="test-speech-btn"
                onClick={() => {
                  soundEngine.speak("مرحباً بكم في التعليم الممتع. النظام الصوتي يعمل بنقاء فائق ووضوح تام!");
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-400/30"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                تجربة نطق التلميحات بالصوت النقي
              </button>

              <button
                id="reset-audio-btn"
                onClick={() => {
                  soundEngine.playClick();
                  soundEngine.setEnvironment('auto');
                }}
                title="استعادة الإعدادات الافتراضية"
                className={`p-2 rounded-xl border active:scale-90 transition-transform cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          className={`p-3 sm:p-4 border-t flex items-center justify-between ${
            isDark
              ? 'bg-[#060a14] border-slate-800/80'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            ✨ تم تفعيل معالجة الصوت DSP التلقائية
          </div>
          <button
            id="audio-modal-save-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-5 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] border border-cyan-400/30"
          >
            حفظ وإغلاق ✓
          </button>
        </div>

      </div>
    </div>
  );
};
