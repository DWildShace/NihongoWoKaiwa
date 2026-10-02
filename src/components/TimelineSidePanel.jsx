// src/components/TimelineSidePanel.jsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, Volume2, User, Bot, History, Sparkles, Eye, EyeOff } from 'lucide-react';
import { speakJapanese } from '../utils/soundEffects';

export default function TimelineSidePanel({ history = [], scenario, onSelectTurn }) {
  // Trạng thái Bật/Tắt ẩn hiện nội dung (lưu vào localStorage)
  const [isContentVisible, setIsContentVisible] = useState(() => {
    try {
      const saved = localStorage.getItem('nihonspeak_timeline_visible');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleContentVisibility = () => {
    setIsContentVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nihonspeak_timeline_visible', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Phím tắt Alt + T để Bật/Tắt nhanh việc ẩn hiện nội dung
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 't' || e.key === 'T') && e.altKey) {
        e.preventDefault();
        toggleContentVisibility();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside className="bg-slate-900/80 rounded-3xl border border-slate-800 p-5 shadow-xl flex flex-col h-full max-h-[850px] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-slate-200">Dòng Thời Gian Hội Thoại</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700/60">
            {history.length} lượt
          </span>

          {/* NÚT BẬT / TẮT ẨN HIỆN NỘI DUNG */}
          <button
            type="button"
            onClick={toggleContentVisibility}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
              isContentVisible
                ? 'bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/35 hover:bg-rose-500/25'
            }`}
            title={
              isContentVisible
                ? 'Ẩn nội dung câu chữ để tập trung luyện nghe & phản xạ không nhìn trước (Alt + T)'
                : 'Hiện lại toàn bộ câu chữ của dòng thời gian (Alt + T)'
            }
          >
            {isContentVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Ẩn</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>Hiện</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* THÂN CỘT: HIỆN DANH SÁCH HOẶC TRẠNG THÁI ẨN */}
      {!isContentVisible ? (
        /* GIAO DIỆN KHI ẨN NỘI DUNG ĐỂ LUYỆN NGHE PHẢN XẠ */
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-3.5 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-inner">
            <EyeOff className="w-6 h-6 text-rose-400" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-200">
              Nội dung câu thoại đang ẩn
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[210px] mx-auto">
              Chế độ ẩn giúp bạn tập trung 100% vào phản xạ nghe & nói mà không bị nhìn trộm chữ trước.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleContentVisibility}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>👁️ Bấm để hiện nội dung</span>
          </button>
        </div>
      ) : (
        /* GIAO DIỆN HIỂN THỊ ĐẦY ĐỦ CÁC LƯỢT THOẠI */
        <>
          <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-xs">Chưa có lượt thoại nào.</p>
                <p className="text-[11px] text-slate-600">
                  Các câu đối đáp giữa bạn và AI sẽ xuất hiện tại đây theo thời gian thực.
                </p>
              </div>
            ) : (
              history.map((item, index) => {
                const isAI = item.speaker === 'ai';
                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 ${
                      isAI
                        ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        : 'bg-rose-950/20 border-rose-900/30 hover:border-rose-800/50'
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isAI ? (
                          <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <Bot className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                            <User className="w-3 h-3" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-300">
                          {isAI ? scenario?.aiRole || 'AI' : scenario?.userRole || 'Bạn'}
                        </span>
                      </div>

                      {/* Nút nghe lại câu này */}
                      <button
                        onClick={() => speakJapanese(item.text, 1.0)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Nghe lại câu này"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Nội dung câu thoại tiếng Nhật */}
                    <p className="font-jp text-sm font-semibold text-slate-100 leading-snug">
                      {item.text}
                    </p>

                    {/* Dịch nghĩa tiếng Việt hoặc điểm số phát âm */}
                    {isAI ? (
                      item.vietnamese && (
                        <p className="text-[11px] text-slate-400 italic">{item.vietnamese}</p>
                      )
                    ) : (
                      item.score !== undefined && (
                        <div className="flex items-center gap-2 pt-1 border-t border-rose-900/20">
                          <span className="text-[11px] font-bold text-amber-300">
                            Điểm phát âm: {item.score}/100 🌟
                          </span>
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            💡 Bôi đen bất kỳ chữ Hán nào để tra cứu & lưu Flashcard
          </div>
        </>
      )}
    </aside>
  );
}
