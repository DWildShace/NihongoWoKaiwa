// src/components/Header.jsx
import React from 'react';
import { Mic, BookOpen, History, Sparkles, Radio } from 'lucide-react';

export default function Header({
  apiStatus,
  flashcardCount,
  onOpenFlashcardModal,
  savedSessionsCount = 0,
  onOpenHistoryModal,
}) {
  const providerLabel = apiStatus?.preferredProvider === 'deepseek'
    ? 'DeepSeek-V3 Engine'
    : apiStatus?.geminiConfigured
    ? 'Gemini 3.1 Flash-Lite'
    : 'Chế độ Hội thoại Thông minh';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white font-bold">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                NihonSpeak
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-jp font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                日本語会話
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Luyện Phản Xạ Nói & Nghe Chép Chính Tả Song Hành
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Server / AI Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiStatus?.ok ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiStatus?.ok ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span>{providerLabel}</span>
          </div>

          {/* Nút Mở Kho Chủ Đề Đã Học & Ôn Tập */}
          <button
            onClick={onOpenHistoryModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-semibold border border-emerald-500/30 transition-all hover:shadow-md cursor-pointer group"
            title="Xem lại các chủ đề, bảng điểm, câu thoại & từ vựng đã học"
          >
            <History className="w-4 h-4 text-emerald-400 group-hover:rotate-[-20deg] transition-transform" />
            <span className="hidden sm:inline">Kho chủ đề</span>
            <span className="sm:hidden">Ôn tập</span>
            {savedSessionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-500/40">
                {savedSessionsCount}
              </span>
            )}
          </button>

          {/* Flashcard Button */}
          <button
            onClick={onOpenFlashcardModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700/80 transition-all hover:shadow-md cursor-pointer group"
          >
            <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Sổ từ vựng</span>
            {flashcardCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {flashcardCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
