import React, { useState } from 'react';
import { Target, Volume2, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react';
import { HighlightedJapaneseText, parseImprovementPoints } from '../utils/evaluationFormatter';
import { speakJapanese } from '../utils/soundEffects';

export default function ImprovementSection({
  grammarImprovements = '',
  detailedImprovements = [],
}) {
  const points = parseImprovementPoints(grammarImprovements, detailedImprovements);
  const [playingItem, setPlayingItem] = useState(null);

  const handlePlaySuggestion = (text, key) => {
    setPlayingItem(key);
    speakJapanese(text, 1.0, () => setPlayingItem(null));
  };

  if (points.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-300">
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
        <div className="text-xs sm:text-sm">
          <strong>Xuất sắc!</strong> Không phát hiện lỗi diễn đạt đáng kể nào trong buổi hội thoại này.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl bg-slate-950/80 border-2 border-amber-500/30 p-4 sm:p-5 lg:p-6 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Focused on Improvements */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                Trọng Tâm Cải Thiện & Sửa Lỗi Cần Khắc Phục
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {points.length} điểm mấu chốt
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bóc tách các điểm chưa tự nhiên & đề xuất cách nói chuẩn bản xứ theo từng lượt
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-300/80 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bấm vào câu chuẩn để nghe phát âm</span>
        </div>
      </div>

      {/* List of Actionable Improvement Cards */}
      <div className="space-y-3.5">
        {points.map((pt, idx) => {
          const hasOriginal = Boolean(pt.original);
          const hasSuggestions = pt.suggestions && pt.suggestions.length > 0;

          return (
            <div
              key={pt.id || idx}
              className="rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/40 p-4 sm:p-5 transition-all shadow-md space-y-3 group"
            >
              {/* Card Meta Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300">
                    📍 {pt.tag}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {pt.turnNumber ? `Chi tiết lượt thứ ${pt.turnNumber}` : 'Lưu ý phản xạ'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-rose-400/90 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  Cần điều chỉnh
                </span>
              </div>

              {/* Before ➔ After Visual Comparison Box */}
              {(hasOriginal || hasSuggestions) && (
                <div className="grid gap-2.5 sm:grid-cols-2 items-stretch pt-1">
                  {/* Cột 1: Câu học viên nói (Chưa tự nhiên) */}
                  {hasOriginal ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/30 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>Chưa tự nhiên / Bạn đã nói:</span>
                        </span>
                      </div>
                      <div className="font-jp font-bold text-sm sm:text-base text-rose-100 tracking-wide">
                        「{pt.original}」
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-center">
                      <span>Cần chú ý cách diễn đạt và ngữ cảnh giao tiếp</span>
                    </div>
                  )}

                  {/* Cột 2: Câu người Nhật khuyên dùng (Đề xuất chuẩn) */}
                  {hasSuggestions ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Người Nhật khuyên dùng:</span>
                        </span>
                        <span className="text-[10px] text-emerald-400/80">Nhấn loa để nghe</span>
                      </div>

                      <div className="space-y-1.5">
                        {pt.suggestions.map((sug, sIdx) => {
                          const isPlaying = playingItem === `${pt.id}_${sIdx}`;
                          return (
                            <div
                              key={sIdx}
                              onClick={() => handlePlaySuggestion(sug, `${pt.id}_${sIdx}`)}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer select-none group/sug ${
                                isPlaying ? 'ring-2 ring-emerald-400' : ''
                              }`}
                              title="Bấm để nghe phát âm"
                            >
                              <span className="font-jp font-bold text-sm sm:text-base text-emerald-200">
                                「{sug}」
                              </span>
                              <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 group-hover/sug:scale-110 transition-transform shrink-0">
                                <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-bounce text-emerald-200' : ''}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-center">
                      <span>Xem phân tích chi tiết bên dưới</span>
                    </div>
                  )}
                </div>
              )}

              {/* Phân tích sư phạm & Lý do chi tiết */}
              {pt.explanation && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs sm:text-[13px] text-slate-300 leading-relaxed space-y-1">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Phân tích & Hướng dẫn sửa:</span>
                  </div>
                  <div>
                    <HighlightedJapaneseText text={pt.explanation} theme="amber" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
