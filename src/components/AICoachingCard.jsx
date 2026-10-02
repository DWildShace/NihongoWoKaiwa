import React from 'react';
import { Award, Volume2, CheckCircle, Sparkles, MessageSquare, ArrowRight, BookOpen, PlusCircle, Check, History } from 'lucide-react';
import { speakJapanese } from '../utils/soundEffects';

export default function AICoachingCard({
  turnIndex = 1,
  totalTurns = 10,
  sessionReview,
  isReviewingSession,
  onFinishSession,
  onNewScenario,
  onSaveFlashcard,
  onOpenHistoryModal,
}) {
  const [savedWords, setSavedWords] = React.useState({});

  const handleAddFlashcard = (item) => {
    if (onSaveFlashcard) {
      onSaveFlashcard({
        id: 'vocab_' + Date.now() + Math.random().toString(36).slice(2, 6),
        word: item.word,
        reading: item.reading || '',
        meaning: item.meaning || '',
        contextSentence: '',
        createdAt: new Date().toISOString(),
      });
      setSavedWords((prev) => ({ ...prev, [item.word]: true }));
    }
  };

  // 1. Trạng thái đang tổng duyệt
  if (isReviewingSession) {
    return (
      <div className="bg-slate-900/80 rounded-3xl border border-indigo-500/40 p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 mx-auto flex items-center justify-center text-indigo-400">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">
            Gemini Master Coach đang phân tích toàn bộ buổi hội thoại...
          </h3>
          <p className="text-xs text-slate-400">
            Tổng duyệt ngữ pháp, sắc thái tự nhiên và chọn lọc các từ vựng tiêu biểu cho bạn.
          </p>
        </div>
      </div>
    );
  }

  // 2. Trạng thái đang diễn ra phiên luyện (chưa kết thúc)
  if (!sessionReview) {
    return (
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800/60 p-5 text-center text-slate-400 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-slate-300">
            Đang trong phiên luyện phản xạ (Lượt {Math.min(turnIndex, totalTurns)} / {totalTurns})
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          AI sẽ không ngắt lời nhận xét giữa chừng để bạn duy trì nhịp nói tự nhiên. Bản báo cáo phân tích toàn diện (ngữ pháp, từ vựng, sắc thái người bản xứ) sẽ tự động xuất hiện khi chạm lượt thứ {totalTurns}.
        </p>
        {turnIndex >= 2 && onFinishSession && (
          <button
            onClick={onFinishSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hoàn thành sớm & Xem bản nhận xét</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Trạng thái Báo cáo tổng kết toàn diện (Comprehensive Report Card)
  const {
    overallScore = 90,
    fluencyFeedback = '',
    grammarStrengths = '',
    grammarImprovements = '',
    naturalNuances = '',
    recommendedVocabulary = [],
  } = sessionReview;

  const scoreColor =
    overallScore >= 90
      ? 'from-emerald-500 to-teal-400 text-emerald-300 border-emerald-500/40'
      : overallScore >= 75
      ? 'from-amber-500 to-yellow-400 text-amber-300 border-amber-500/40'
      : 'from-rose-500 to-orange-400 text-rose-300 border-rose-500/40';

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-6 animate-fadeIn">
      {/* Header: Score & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Báo Cáo Phân Tích Toàn Diện Buổi Hội Thoại
            </h3>
            <p className="text-xs text-slate-400">
              Tổng kết năng lực giao tiếp & phản xạ qua các lượt thoại
            </p>
          </div>
        </div>

        {/* Điểm tổng quan */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Điểm tổng kết:</span>
          <div className={`px-4 py-1.5 rounded-2xl bg-gradient-to-r ${scoreColor} font-black text-xl shadow-sm border flex items-center gap-1.5`}>
            <span>{overallScore}</span>
            <span className="text-xs font-normal opacity-80">/ 100 🌟</span>
          </div>
        </div>
      </div>

      {/* 1. Nhận xét độ trôi chảy & phản xạ */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
          <Sparkles className="w-4 h-4" />
          <span>Đánh giá độ trôi chảy & Phản xạ giao tiếp:</span>
        </div>
        <p className="text-xs lg:text-sm text-slate-200 leading-relaxed font-medium">
          {fluencyFeedback}
        </p>
      </div>

      {/* 2. Điểm mạnh ngữ pháp & Điểm cần cải thiện */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Điểm mạnh */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Điểm mạnh ngữ pháp & Từ vựng:</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {grammarStrengths}
          </p>
        </div>

        {/* Điểm cần cải thiện */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Gợi ý cải thiện & Sửa lỗi:</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {grammarImprovements}
          </p>
        </div>
      </div>

      {/* 3. Sắc thái tự nhiên của người bản xứ */}
      {naturalNuances && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <BookOpen className="w-4 h-4" />
            <span>Bí quyết nói tự nhiên như người Nhật bản xứ:</span>
          </div>
          <p className="text-xs lg:text-sm text-indigo-100 leading-relaxed">
            {naturalNuances}
          </p>
        </div>
      )}

      {/* 4. Từ vựng & Mẫu câu đắt giá khuyên lưu Flashcard */}
      {recommendedVocabulary && recommendedVocabulary.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Từ vựng & Mẫu câu đắt giá từ buổi học:</span>
            <span className="text-[11px] font-normal text-slate-500">Bấm (+) để lưu vào sổ tay</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedVocabulary.map((item, idx) => {
              const isSaved = savedWords[item.word];
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-all"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-jp font-bold text-slate-100 text-sm truncate">{item.word}</p>
                      <button
                        onClick={() => speakJapanese(item.word, 1.0)}
                        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {item.reading && item.reading !== item.word && (
                      <p className="text-[11px] text-slate-400 font-jp truncate">{item.reading}</p>
                    )}
                    <p className="text-xs text-amber-300/90 truncate">{item.meaning}</p>
                  </div>

                  <button
                    onClick={() => handleAddFlashcard(item)}
                    disabled={isSaved}
                    className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white border border-slate-700'
                    }`}
                    title={isSaved ? 'Đã lưu' : 'Thêm vào Flashcard'}
                  >
                    {isSaved ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Nút Bắt đầu Ngữ cảnh Mới & Thông báo Lưu trữ */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Đã tự động lưu vào <strong>Kho chủ đề đã học</strong></span>
          {onOpenHistoryModal && (
            <button
              onClick={onOpenHistoryModal}
              className="ml-1.5 underline font-bold hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Mở xem lại & ôn tập →
            </button>
          )}
        </div>

        {onNewScenario && (
          <button
            onClick={onNewScenario}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>🎲 Bắt đầu một tình huống mới</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
