// src/components/StudyHistoryModal.jsx
import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Award,
  BookOpen,
  MessageSquare,
  Volume2,
  Trash2,
  RotateCcw,
  Search,
  Sparkles,
  CheckCircle,
  PlusCircle,
  Check,
  ChevronRight,
  Calendar,
  Layers,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { speakJapanese } from '../utils/soundEffects';

export default function StudyHistoryModal({
  isOpen,
  onClose,
  savedSessions = [],
  onDeleteSession,
  onClearAllSessions,
  onReplayScenario,
  onSaveFlashcard,
  savedFlashcards = [],
}) {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'dialogue' | 'vocab'
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [localSavedWords, setLocalSavedWords] = useState({});

  // Lập set các từ vựng đã có trong Sổ Flashcard chính
  const existingWordsSet = useMemo(() => {
    const set = new Set();
    savedFlashcards.forEach((f) => {
      if (f.kanji) set.add(f.kanji);
      if (f.word) set.add(f.word);
    });
    return set;
  }, [savedFlashcards]);

  // Lọc danh sách phiên học theo tìm kiếm và level
  const filteredSessions = useMemo(() => {
    return savedSessions.filter((s) => {
      const titleMatch = (s.scenario?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.scenario?.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const levelMatch = levelFilter === 'all' || s.scenario?.level === levelFilter;
      return titleMatch && levelMatch;
    });
  }, [savedSessions, searchQuery, levelFilter]);

  // Chọn phiên học hiện tại đang xem chi tiết
  const currentSession = useMemo(() => {
    if (selectedSessionId) {
      const found = savedSessions.find((s) => s.id === selectedSessionId);
      if (found) return found;
    }
    return filteredSessions[0] || null;
  }, [selectedSessionId, savedSessions, filteredSessions]);

  // Tính điểm trung bình các buổi học
  const averageScore = useMemo(() => {
    if (savedSessions.length === 0) return 0;
    const total = savedSessions.reduce((acc, s) => acc + (s.review?.overallScore || 85), 0);
    return Math.round(total / savedSessions.length);
  }, [savedSessions]);

  if (!isOpen) return null;

  // Xử lý lưu từ vựng vào Flashcard chính
  const handleAddFlashcardFromHistory = (item) => {
    if (onSaveFlashcard) {
      onSaveFlashcard({
        id: 'vocab_' + Date.now() + Math.random().toString(36).slice(2, 6),
        word: item.word || item.kanji,
        kanji: item.word || item.kanji,
        reading: item.reading || '',
        meaning: item.meaning || '',
        contextSentence: currentSession?.scenario?.title || '',
        createdAt: new Date().toISOString(),
      });
      setLocalSavedWords((prev) => ({ ...prev, [item.word || item.kanji]: true }));
    }
  };

  // Định dạng thời gian thân thiện
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 1. MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Kho Chủ Đề Đã Học & Trung Tâm Ôn Luyện
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {savedSessions.length} chủ đề
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Lưu trữ toàn bộ ngữ cảnh, dòng thoại đối đáp, bảng điểm & Flashcard để bạn ôn luyện lại bất cứ lúc nào.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSessions.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Điểm trung bình:</span>
                <span className="font-bold text-amber-300">{averageScore}/100</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. THANH TÌM KIẾM & BỘ LỌC CẤP ĐỘ */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên chủ đề hoặc từ khóa..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
          </div>

          {/* Lọc theo Cấp độ JLPT */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'N5', 'N4', 'N3', 'N2'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {lvl === 'all' ? 'Tất cả cấp độ' : lvl}
              </button>
            ))}

            {savedSessions.length > 0 && onClearAllSessions && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử các chủ đề đã học?')) {
                    onClearAllSessions();
                  }
                }}
                className="ml-2 text-slate-500 hover:text-rose-400 text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Xóa toàn bộ kho lưu trữ"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* 3. MODAL BODY (SPLIT VIEW: CỘT DANH SÁCH & CỘT CHI TIẾT ÔN TẬP) */}
        <div className="flex-1 flex overflow-hidden">
          {savedSessions.length === 0 ? (
            /* TRẠNG THÁI TRỐNG */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-base font-bold text-slate-200">
                  Chưa có chủ đề nào được lưu trữ
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Khi bạn hoàn thành một tình huống giao tiếp (hoặc bấm "Hoàn thành sớm & Xem nhận xét"), toàn bộ ngữ cảnh, dòng thoại đối đáp, bảng điểm chi tiết và từ vựng sẽ được tự động lưu vào đây để bạn ôn luyện lại bất kỳ lúc nào.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CỘT TRÁI: DANH SÁCH CÁC CHỦ ĐỀ ĐÃ HỌC (35% - 40%) */}
              <div className="w-full lg:w-[38%] border-r border-slate-800/80 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-950/40">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Không tìm thấy chủ đề phù hợp với từ khóa.
                  </div>
                ) : (
                  filteredSessions.map((s) => {
                    const isSelected = currentSession?.id === s.id;
                    const score = s.review?.overallScore || 85;
                    const scoreColor =
                      score >= 90
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : score >= 75
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSessionId(s.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          {/* Badge Level & Lượt */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {s.scenario?.level && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {s.scenario.level}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {s.history?.length || s.turnsCount || 10} lượt thoại
                            </span>
                          </div>

                          {/* Điểm số */}
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${scoreColor}`}>
                            {score} điểm
                          </span>
                        </div>

                        {/* Tiêu đề tình huống */}
                        <h4 className="text-sm font-bold text-white font-jp tracking-tight line-clamp-1 group-hover:text-emerald-300 transition-colors">
                          {s.scenario?.title || 'Tình huống giao tiếp'}
                        </h4>

                        {/* Vai trò & Thời gian */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                          <span className="truncate max-w-[170px]">
                            {s.scenario?.aiRole} ↔ {s.scenario?.userRole}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatTime(s.completedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* CỘT PHẢI: TRUNG TÂM CHI TIẾT ÔN LUYỆN (62%) */}
              <div className="hidden lg:flex flex-1 flex-col overflow-y-auto bg-slate-900/60">
                {currentSession ? (
                  <div className="p-5 lg:p-6 space-y-6">
                    {/* 1. Header Tình Huống Chi Tiết & Nút Luyện Lại */}
                    <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              JLPT {currentSession.scenario?.level || 'N4'}
                            </span>
                            <span className="text-xs text-slate-400">
                              Chủ đề: <strong className="text-slate-300">{currentSession.scenario?.topic || 'Hàng ngày'}</strong>
                            </span>
                            <span className="text-xs text-slate-500">• {formatTime(currentSession.completedAt)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white font-jp">
                            {currentSession.scenario?.title}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {currentSession.scenario?.description}
                          </p>
                        </div>

                        {/* Các nút hành động chính */}
                        <div className="flex items-center gap-2">
                          {/* Nút Luyện tập lại chủ đề này */}
                          {onReplayScenario && (
                            <button
                              onClick={() => {
                                onReplayScenario(currentSession);
                                onClose();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Tải lại chủ đề này lên màn hình chính để luyện tập lại từ đầu"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>🎯 Luyện tập lại chủ đề này</span>
                            </button>
                          )}

                          {/* Nút xóa bài học */}
                          {onDeleteSession && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn xóa chủ đề "${currentSession.scenario?.title}" khỏi lịch sử?`)) {
                                  onDeleteSession(currentSession.id);
                                }
                              }}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                              title="Xóa chủ đề này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Phân vai */}
                      <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-4">
                        <span>AI: <strong className="text-slate-200">{currentSession.scenario?.aiRole}</strong></span>
                        <span>•</span>
                        <span>Bạn: <strong className="text-slate-200">{currentSession.scenario?.userRole}</strong></span>
                      </div>
                    </div>

                    {/* 2. THANH TAB CHUYỂN ĐỔI: BÁO CÁO / HỘI THOẠI / FLASHCARD */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <button
                        onClick={() => setActiveTab('review')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          activeTab === 'review'
                            ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Báo cáo & Điểm số</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('dialogue')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          activeTab === 'dialogue'
                            ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Toàn bộ câu thoại ({currentSession.history?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('vocab')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          activeTab === 'vocab'
                            ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>
                          Từ vựng Flashcard ({currentSession.review?.recommendedVocabulary?.length || 0})
                        </span>
                      </button>
                    </div>

                    {/* 3. NỘI DUNG TỪNG TAB */}
                    {/* TAB 1: BÁO CÁO & ĐIỂM SỐ */}
                    {activeTab === 'review' && (
                      <div className="space-y-4 animate-fadeIn">
                        {currentSession.review ? (
                          <>
                            {/* Điểm tổng quan */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950/80 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-xs text-slate-400">Kết quả đánh giá tổng quan:</span>
                                <h4 className="text-base font-bold text-white">Năng lực phản xạ & Độ chuẩn xác</h4>
                              </div>
                              <div className="px-4 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-2xl">
                                {currentSession.review.overallScore || 90} <span className="text-xs font-normal opacity-80">/ 100</span>
                              </div>
                            </div>

                            {/* Đánh giá trôi chảy */}
                            {currentSession.review.fluencyFeedback && (
                              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                                  <Sparkles className="w-4 h-4" />
                                  <span>Đánh giá độ trôi chảy & Phản xạ:</span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                                  {currentSession.review.fluencyFeedback}
                                </p>
                              </div>
                            )}

                            {/* Điểm mạnh & Điểm cần sửa */}
                            <div className="grid gap-3.5 sm:grid-cols-2">
                              {currentSession.review.grammarStrengths && (
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Điểm mạnh ngữ pháp:</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {currentSession.review.grammarStrengths}
                                  </p>
                                </div>
                              )}

                              {currentSession.review.grammarImprovements && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Gợi ý hoàn thiện & Sửa lỗi:</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {currentSession.review.grammarImprovements}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Sắc thái người bản xứ */}
                            {currentSession.review.naturalNuances && (
                              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                                  <BookOpen className="w-4 h-4" />
                                  <span>Bí quyết nói tự nhiên như người Nhật:</span>
                                </div>
                                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                                  {currentSession.review.naturalNuances}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-10 text-slate-500 text-xs">
                            Phiên học này kết thúc sớm, chưa kịp xuất bản báo cáo nhận xét chi tiết.
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: TOÀN BỘ CÂU THOẠI & SHADOWING */}
                    {activeTab === 'dialogue' && (
                      <div className="space-y-3 animate-fadeIn">
                        <p className="text-xs text-slate-400">
                          Bấm vào biểu tượng loa để nghe lại từng câu của AI hoặc câu bạn đã nói để luyện Shadowing:
                        </p>
                        {(!currentSession.history || currentSession.history.length === 0) ? (
                          <div className="text-center py-8 text-slate-500 text-xs">
                            Không có dữ liệu câu thoại cho chủ đề này.
                          </div>
                        ) : (
                          currentSession.history.map((turn, idx) => {
                            const isAi = turn.speaker === 'ai';
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all ${
                                  isAi
                                    ? 'bg-slate-950/80 border-slate-800'
                                    : 'bg-indigo-950/30 border-indigo-500/30'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                    isAi ? 'text-emerald-400' : 'text-indigo-300'
                                  }`}>
                                    {isAi ? (currentSession.scenario?.aiRole || 'AI') : (currentSession.scenario?.userRole || 'Bạn')}
                                  </span>

                                  <button
                                    onClick={() => speakJapanese(turn.text, 1.0)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Nghe phát âm chuẩn"
                                  >
                                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Nghe lại</span>
                                  </button>
                                </div>

                                <p className="font-jp font-bold text-sm sm:text-base text-slate-100 leading-relaxed">
                                  {turn.text}
                                </p>
                                {turn.vietnamese && (
                                  <p className="text-xs text-slate-400 italic mt-0.5">
                                    {turn.vietnamese}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* TAB 3: TỪ VỰNG & FLASHCARDS CỦA CHỦ ĐỀ */}
                    {activeTab === 'vocab' && (
                      <div className="space-y-3.5 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Từ vựng & Mẫu câu đắt giá trích xuất từ chủ đề:</span>
                          <span className="text-[11px] text-slate-500">Bấm (+) để lưu vào sổ tay chính</span>
                        </div>

                        {(!currentSession.review?.recommendedVocabulary || currentSession.review.recommendedVocabulary.length === 0) ? (
                          <div className="text-center py-10 text-slate-500 text-xs">
                            Chưa có danh sách từ vựng đề xuất cho bài học này.
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {currentSession.review.recommendedVocabulary.map((v, vIdx) => {
                              const wordKey = v.word || v.kanji;
                              const isAlreadySaved = existingWordsSet.has(wordKey) || localSavedWords[wordKey];

                              return (
                                <div
                                  key={vIdx}
                                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-all"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-jp font-bold text-slate-100 text-sm truncate">{wordKey}</p>
                                      <button
                                        onClick={() => speakJapanese(wordKey, 1.0)}
                                        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                        title="Nghe phát âm"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {v.reading && v.reading !== wordKey && (
                                      <p className="text-[11px] text-slate-400 font-jp truncate">[{v.reading}]</p>
                                    )}
                                    <p className="text-xs text-amber-300/90 truncate">{v.meaning}</p>
                                  </div>

                                  <button
                                    onClick={() => handleAddFlashcardFromHistory(v)}
                                    disabled={isAlreadySaved}
                                    className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                                      isAlreadySaved
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white border border-slate-700'
                                    }`}
                                    title={isAlreadySaved ? 'Đã lưu trong sổ tay' : 'Thêm vào Sổ Flashcard chính'}
                                  >
                                    {isAlreadySaved ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-slate-500 text-xs">
                    Chọn một chủ đề ở danh sách bên trái để xem chi tiết và ôn tập.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
