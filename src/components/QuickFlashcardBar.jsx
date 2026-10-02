// src/components/QuickFlashcardBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { BookmarkPlus, Check, X, Sparkles, Volume2, Loader2, Languages, CornerDownLeft } from 'lucide-react';
import { speakJapanese } from '../utils/soundEffects';

export default function QuickFlashcardBar({ selection, onSave, onClear }) {
  const [reading, setReading] = useState('');
  const [meaning, setMeaning] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const inputRef = useRef(null);
  const selectedText = selection?.text?.trim() || '';

  // Khi selection thay đổi: lấy reading Hiragana và gợi ý nghĩa
  useEffect(() => {
    if (!selectedText) {
      setReading('');
      setMeaning('');
      setIsSaved(false);
      return;
    }

    setIsSaved(false);

    // Gán nghĩa gợi ý từ ngữ cảnh hội thoại nếu có sẵn
    if (selection?.suggestedMeaning) {
      setMeaning(selection.suggestedMeaning);
    } else {
      setMeaning('');
    }

    // Tự động phân tích Furigana / Reading qua Kuromoji
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
      .catch((err) => console.warn('[Tokenize Error]:', err.message));

    // Tự động focus và bôi đen input để người dùng gõ hoặc bấm Enter ngay
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [selectedText, selection?.suggestedMeaning]);

  // Lắng nghe phím bấm toàn cục (Escape để thoát, Enter để lưu)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedText) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClear) onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedText, onClear]);

  if (!selectedText) return null;

  // Xử lý phát âm thanh tiếng Nhật
  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    speakJapanese(selectedText, 1.0);
    setTimeout(() => setIsPlayingAudio(false), 1200);
  };

  // Dịch nhanh tự động bằng AI (DeepSeek / Gemini)
  const handleAiTranslate = async () => {
    if (isTranslating) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          context: selection?.contextSentence || '',
        }),
      });
      const json = await res.json();
      if (json?.success && json?.meaning) {
        setMeaning(json.meaning);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      console.warn('[AI Translate Error]:', err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  // Xử lý lưu Flashcard
  const handleSave = () => {
    if (isSaved) return;

    const finalMeaning =
      meaning.trim() || selection?.suggestedMeaning?.trim() || 'Từ vựng lưu từ bài học';

    if (onSave) {
      onSave({
        id: 'fc_' + Date.now(),
        kanji: selectedText,
        word: selectedText,
        reading: reading || selectedText,
        meaning: finalMeaning,
        contextSentence: selection?.contextSentence || '',
        createdAt: new Date().toISOString(),
      });
      setIsSaved(true);
      setTimeout(() => {
        if (onClear) onClear();
      }, 900);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="quick-flashcard-card fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.12)] rounded-3xl p-4 sm:p-5 text-white animate-pop-up transition-all select-none">
      {/* Viền ánh kim trang trí phía trên */}
      <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full opacity-80" />

      {/* Header thanh thẻ */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <BookmarkPlus className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Tạo Thẻ Flashcard Nhanh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
            Esc để đóng
          </span>
          <button
            onClick={onClear}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thân thẻ: Hiển thị chữ tiếng Nhật và âm đọc Furigana */}
      <div className="bg-slate-950/75 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 my-3 flex items-start gap-3.5 shadow-inner">
        {/* Nút phát âm */}
        <button
          onClick={handlePlayAudio}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105 shadow-md shadow-amber-500/30'
              : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-400 hover:scale-105 active:scale-95'
          }`}
          title="Nghe phát âm chuẩn (Neural Voice)"
        >
          <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
        </button>

        {/* Nội dung từ / câu tiếng Nhật */}
        <div className="flex-1 min-w-0">
          <div className="text-lg sm:text-xl font-bold font-jp text-amber-300 leading-snug tracking-wide select-text break-words">
            {selectedText}
          </div>

          {/* Âm đọc Hiragana */}
          {reading && reading !== selectedText && (
            <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm font-jp">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                Âm đọc
              </span>
              <span className="text-amber-200/90 font-medium">【{reading}】</span>
            </div>
          )}

          {/* Trích dẫn ngữ cảnh câu */}
          {selection?.contextSentence && selection.contextSentence !== selectedText && (
            <div className="text-[11px] text-slate-400/80 italic mt-2 line-clamp-1 border-t border-slate-850 pt-1.5 flex items-center gap-1.5">
              <span className="text-slate-500 not-italic shrink-0">Ngữ cảnh:</span>
              <span className="text-slate-300 truncate font-jp">"{selection.contextSentence}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Nhập nghĩa tiếng Việt & Gợi ý AI */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Nghĩa tiếng Việt</span>
            <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
              (Gõ nghĩa hoặc bấm Enter để lưu)
            </span>
          </label>

          {/* Nút dịch tự động AI */}
          <button
            onClick={handleAiTranslate}
            disabled={isTranslating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all cursor-pointer disabled:opacity-50"
            title="Dịch nhanh từ vựng bằng AI"
          >
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isTranslating ? 'Đang dịch...' : 'Dịch AI'}</span>
          </button>
        </div>

        {/* Ô Input nhập nghĩa */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Nhập nghĩa tiếng Việt (tùy chọn)..."
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all pr-8"
          />
          {meaning && (
            <button
              onClick={() => setMeaning('')}
              className="absolute right-2.5 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chip gợi ý nghĩa từ ngữ cảnh (nếu có và chưa chọn) */}
        {selection?.suggestedMeaning && meaning !== selection.suggestedMeaning && (
          <button
            onClick={() => setMeaning(selection.suggestedMeaning)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors cursor-pointer w-full text-left"
          >
            <span>💡 Dùng nghĩa từ ngữ cảnh:</span>
            <span className="font-semibold underline truncate">"{selection.suggestedMeaning}"</span>
          </button>
        )}
      </div>

      {/* Footer hành động & Phím tắt */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono font-bold">
              ↵ Enter
            </kbd>
            <span>Lưu</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono font-bold">
              Esc
            </kbd>
            <span>Hủy</span>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onClear}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/25 hover:scale-105 active:scale-95'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Đã lưu vào Sổ!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-slate-950" />
                <span>Lưu Flashcard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
