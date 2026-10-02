// src/components/TimelineSidePanel.jsx
import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import {
  StrawHatIcon,
  OceanWavesIcon,
  PirateShipIcon,
  LogPoseCompassIcon,
  ChopperHatIcon,
  SunnyMascotIcon,
} from './NauticalIcons';
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
      {/* Header dòng thời gian hải trình */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <OceanWavesIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Dòng Thời Gian Hội Thoại</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700/60">
            {history.length} lượt
          </span>

          {/* NÚT BẬT / TẮT ẨN HIỆN NỘI DUNG (THEME SÓNG BIỂN & HẢI TRÌNH) */}
          <button
            type="button"
            onClick={toggleContentVisibility}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
              isContentVisible
                ? 'bg-slate-800/90 hover:bg-cyan-950/60 text-cyan-300 hover:text-cyan-200 border-slate-700 hover:border-cyan-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
            }`}
            title={
              isContentVisible
                ? 'Chế độ Lướt Sóng: Ẩn phụ đề chữ để luyện nghe & phản xạ như vượt sóng gió (Alt + T)'
                : 'Mở Hải Đồ: Hiện lại toàn bộ câu chữ của dòng thời gian (Alt + T)'
            }
          >
            {isContentVisible ? (
              <>
                <OceanWavesIcon className="w-3.5 h-3.5" />
                <span>Lướt sóng</span>
              </>
            ) : (
              <>
                <PirateShipIcon className="w-3.5 h-3.5" />
                <span>Hải đồ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* THÂN CỘT: HIỆN DANH SÁCH HOẶC TRẠNG THÁI ẨN */}
      {!isContentVisible ? (
        /* GIAO DIỆN KHI ẨN NỘI DUNG: CHỦ ĐỀ SÓNG BIỂN & MŨ RƠM ONE PIECE */
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 animate-fadeIn">
          {/* Biểu tượng Mũ Rơm lướt trên sóng biển */}
          <div
            className="relative group cursor-pointer"
            onClick={toggleContentVisibility}
            title="Bấm để mở lời thoại"
          >
            {/* Khung hào quang xanh biển ngọc & vàng rực */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-cyan-950/90 via-blue-900/40 to-slate-900 border border-cyan-500/35 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.22)] group-hover:scale-105 group-hover:border-amber-400/60 transition-all duration-300">
              <StrawHatIcon className="w-12 h-12 drop-shadow-md group-hover:rotate-6 transition-transform" />
            </div>

            {/* Huy hiệu sóng biển cuộn trào góc dưới */}
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <OceanWavesIcon className="w-5 h-5 text-cyan-300" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5">
              <span>Thử Thách Lướt Sóng Phản Xạ</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                Grand Line
              </span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[230px] mx-auto">
              Ẩn chữ để đôi tai tập trung bắt nhịp âm thanh, phản xạ tự nhiên vượt sóng gió mà không nhìn trộm chữ trước.
            </p>
          </div>

          {/* Nút giương buồm mở hải đồ */}
          <button
            type="button"
            onClick={toggleContentVisibility}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <PirateShipIcon className="w-4 h-4" />
            <span>Giương Buồm • Mở Hải Đồ Lời Thoại</span>
          </button>

          <span className="text-[10px] text-slate-500 font-mono">
            Phím tắt: Alt + T
          </span>
        </div>
      ) : (
        /* GIAO DIỆN HIỂN THỊ ĐẦY ĐỦ CÁC LƯỢT THOẠI */
        <>
          <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2.5">
                <OceanWavesIcon className="w-10 h-10 mx-auto text-slate-700/80" />
                <p className="text-xs font-medium text-slate-400">Chưa có lượt thoại nào trong hải trình.</p>
                <p className="text-[11px] text-slate-600 max-w-[220px] mx-auto">
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
                        : 'bg-amber-950/15 border-amber-900/30 hover:border-amber-800/40'
                    }`}
                  >
                    {/* Speaker Header với Avatar Anime One Piece */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAI ? (
                          <span
                            className="w-6 h-6 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shadow-sm"
                            title="Bạn đồng hành AI (Chopper)"
                          >
                            <ChopperHatIcon className="w-4 h-4" />
                          </span>
                        ) : (
                          <span
                            className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-sm"
                            title="Thuyền viên Mũ Rơm (Bạn)"
                          >
                            <StrawHatIcon className="w-4 h-4" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-300">
                          {isAI ? scenario?.aiRole || 'AI Đồng Hành' : scenario?.userRole || 'Bạn'}
                        </span>
                      </div>

                      {/* Nút nghe lại câu này */}
                      <button
                        onClick={() => speakJapanese(item.text, 1.0)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
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
                        <div className="flex items-center gap-2 pt-1 border-t border-amber-900/20">
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
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Bôi đen chữ Hán bất kỳ để lưu Flashcard nhanh</span>
          </div>
        </>
      )}
    </aside>
  );
}
