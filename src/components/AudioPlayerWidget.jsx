// src/components/AudioPlayerWidget.jsx
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Volume2, RotateCcw, Play, Square } from 'lucide-react';
import { speakJapanese, stopSpeaking } from '../utils/soundEffects';

const AudioPlayerWidget = forwardRef(function AudioPlayerWidget(
  { text, speed = 1.0, onSpeedChange },
  ref
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voice, setVoice] = useState(() => {
    try {
      return localStorage.getItem('nihonspeak_tts_voice') || 'nanami';
    } catch {
      return 'nanami';
    }
  });

  const handleVoiceChange = (v) => {
    setVoice(v);
    try {
      localStorage.setItem('nihonspeak_tts_voice', v);
    } catch (e) {
      console.warn('[LocalStorage Error]', e);
    }
  };

  const handlePlay = (rate = speed, selectedVoice = voice) => {
    if (!text) return;
    setIsPlaying(true);
    speakJapanese(
      text,
      rate,
      () => {
        setIsPlaying(false);
      },
      selectedVoice
    );
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPlaying(false);
  };

  useImperativeHandle(ref, () => ({
    play: () => handlePlay(speed),
    stop: () => handleStop(),
    togglePlay: () => {
      if (isPlaying) {
        handleStop();
      } else {
        handlePlay(speed);
      }
    },
    isPlaying: () => isPlaying,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-inner">
      {/* Play Controls & Waveform */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (isPlaying ? handleStop() : handlePlay(speed))}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-105'
          }`}
          title={isPlaying ? 'Dừng phát (Ctrl + Space hoặc Space)' : 'Nghe câu thoại (Ctrl + Space hoặc Space)'}
        >
          {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => handlePlay(speed)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors cursor-pointer"
          title="Nghe lại từ đầu"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Dynamic Waveform Bars */}
        <div className="flex items-center gap-1 h-6 px-1">
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((val, idx) => (
            <span
              key={idx}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, (val * (Math.sin(Date.now() / 150 + idx) + 1.2)) / 2)}%` : '20%',
              }}
            />
          ))}
        </div>

        {/* Shortcut badge */}
        <div className="hidden sm:flex items-center">
          <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold rounded bg-slate-900 text-slate-400 border border-slate-700/70 shadow-sm" title="Phím tắt: Bấm Space hoặc Ctrl+Space">
            Space
          </kbd>
        </div>
      </div>

      {/* Voice Selector & Speed Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Bộ chọn giọng đọc Studio */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 px-1.5 font-medium">Giọng:</span>
          <button
            onClick={() => {
              handleVoiceChange('nanami');
              if (isPlaying) handlePlay(speed, 'nanami');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              voice === 'nanami'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Giọng Nữ bản xứ (Nanami Neural)"
          >
            <span>👩 Nữ</span>
          </button>
          <button
            onClick={() => {
              handleVoiceChange('keita');
              if (isPlaying) handlePlay(speed, 'keita');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              voice === 'keita'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Giọng Nam bản xứ (Keita Neural)"
          >
            <span>👨 Nam</span>
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 px-1.5 font-medium">Tốc độ:</span>
          {[0.75, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              onClick={() => {
                if (onSpeedChange) onSpeedChange(rate);
                handlePlay(rate);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                speed === rate
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default AudioPlayerWidget;
