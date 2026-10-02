// src/components/FlashcardModal.jsx
import React, { useState } from 'react';
import { X, Trash2, Download, Volume2, BookOpen, Layers } from 'lucide-react';
import { speakJapanese } from '../utils/soundEffects';

export default function FlashcardModal({ isOpen, onClose, flashcards = [], onDeleteCard }) {
  const [flippedCards, setFlippedCards] = useState({});

  if (!isOpen) return null;

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Xuất file Anki (.txt) Tab-separated
  const handleExportAnki = () => {
    if (flashcards.length === 0) return;
    const content = flashcards
      .map((c) => `${c.kanji}\t${c.reading}\t${c.meaning}\t${c.contextSentence || ''}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NihonSpeak_Anki_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sổ Tay Từ Vựng Flashcard</h3>
              <p className="text-xs text-slate-400">Đã lưu {flashcards.length} từ vựng từ các buổi trò chuyện</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {flashcards.length > 0 && (
              <button
                onClick={handleExportAnki}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Xuất định dạng Anki Deck (.txt)"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Xuất Anki</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Cards List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {flashcards.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-medium">Chưa có từ vựng nào được lưu.</p>
              <p className="text-xs text-slate-600">
                Khi luyện giao tiếp, hãy bôi đen bất kỳ từ vựng nào trên màn hình để lưu thẻ.
              </p>
            </div>
          ) : (
            flashcards.map((card) => {
              const isFlipped = flippedCards[card.id];
              return (
                <div
                  key={card.id}
                  onClick={() => toggleFlip(card.id)}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-jp font-bold text-lg text-amber-300">{card.kanji}</span>
                      {card.reading && card.reading !== card.kanji && (
                        <span className="text-xs font-jp text-slate-400">[{card.reading}]</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      {isFlipped ? (
                        <span className="text-emerald-400 font-semibold">{card.meaning}</span>
                      ) : (
                        <span className="text-slate-500 italic">Bấm để lật xem nghĩa...</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => speakJapanese(card.kanji, 1.0)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {onDeleteCard && (
                      <button
                        onClick={() => onDeleteCard(card.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Xóa thẻ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
