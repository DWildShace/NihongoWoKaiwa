// src/components/QuickFlashcardBar.jsx
import React, { useState, useEffect } from 'react';
import { BookmarkPlus, Check, X, Sparkles, Volume2 } from 'lucide-react';
import { speakJapanese } from '../utils/soundEffects';

export default function QuickFlashcardBar({ selection, onSave, onClear }) {
  const [reading, setReading] = useState('');
  const [meaning, setMeaning] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const selectedText = selection?.text?.trim() || '';

  useEffect(() => {
    if (!selectedText) {
      setReading('');
      setMeaning('');
      setIsSaved(false);
      return;
    }

    setIsSaved(false);
    // Gọi API tokenize để lấy reading Hiragana
    fetch('/api/chat/tokenize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: selectedText }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.reading) {
          setReading(json.data.reading);
        }
      })
      .catch(() => {});
  }, [selectedText]);

  if (!selectedText) return null;

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: 'fc_' + Date.now(),
        kanji: selectedText,
        reading: reading || selectedText,
        meaning: meaning || 'Từ vựng lưu từ hội thoại',
        contextSentence: selection?.contextSentence || '',
        createdAt: new Date().toISOString(),
      });
      setIsSaved(true);
      setTimeout(() => {
        if (onClear) onClear();
      }, 1200);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3 sm:p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideUp">
      {/* Thông tin từ vựng */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => speakJapanese(selectedText, 1.0)}
          className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title="Nghe phát âm"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span className="font-jp font-bold text-base text-amber-300">{selectedText}</span>
            {reading && reading !== selectedText && (
              <span className="text-xs font-jp text-slate-400">[{reading}]</span>
            )}
          </div>
          <input
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="Nhập nghĩa tiếng Việt (tùy chọn)..."
            className="text-xs bg-slate-950/60 border border-slate-700/60 rounded-lg px-2 py-1 mt-1 text-slate-200 placeholder:text-slate-500 w-full focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Hành động */}
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        <button
          onClick={handleSave}
          disabled={isSaved}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer ${
            isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
          }`}
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'Đã lưu!' : 'Lưu Flashcard'}</span>
        </button>

        <button
          onClick={onClear}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
