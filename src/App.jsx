// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DictationSpeakingCard from './components/DictationSpeakingCard';
import AICoachingCard from './components/AICoachingCard';
import TimelineSidePanel from './components/TimelineSidePanel';
import QuickFlashcardBar from './components/QuickFlashcardBar';
import FlashcardModal from './components/FlashcardModal';
import { speakJapanese } from './utils/soundEffects';

export default function App() {
  // Scenario & Chat States
  const [scenario, setScenario] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [history, setHistory] = useState([]);
  const [turnIndex, setTurnIndex] = useState(1);
  const TOTAL_TURNS = 10;

  // Session Review States
  const [sessionReview, setSessionReview] = useState(null);
  const [isReviewingSession, setIsReviewingSession] = useState(false);

  // Status & Loading States
  const [apiStatus, setApiStatus] = useState({ ok: true, geminiConfigured: false });
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [isEvaluatingSpeaking, setIsEvaluatingSpeaking] = useState(false);

  // Filter States for Scenarios
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  // Flashcards & Selection
  const [flashcards, setFlashcards] = useState(() => {
    try {
      const saved = localStorage.getItem('nihonspeak_flashcards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [selection, setSelection] = useState(null);

  // Lưu Flashcards vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('nihonspeak_flashcards', JSON.stringify(flashcards));
    } catch (e) {
      console.error('[LocalStorage Error]', e);
    }
  }, [flashcards]);

  // Kiểm tra Health Check backend
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus({ ok: true, geminiConfigured: data.geminiConfigured });
      })
      .catch((err) => {
        console.warn('[Health Check Failed]', err);
        setApiStatus({ ok: false, geminiConfigured: false });
      });
  }, []);

  // Tự động tải ngữ cảnh ngẫu nhiên ban đầu
  useEffect(() => {
    handleRandomScenario();
  }, []);

  // Bắt sự kiện bôi đen văn bản để hiện QuickFlashcardBar
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';

      // Kiểm tra có chứa chữ tiếng Nhật (Hiragana, Katakana, Kanji)
      const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(text);
      if (text && hasJapanese && text.length <= 40) {
        setSelection({
          text,
          contextSentence: currentTurn?.aiSentence || '',
        });
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [currentTurn]);

  // 1. Khởi tạo / Random Ngữ cảnh mới (có hỗ trợ lọc theo Level và Topic)
  const handleRandomScenario = async (filterOverrides = {}) => {
    const level = filterOverrides.level !== undefined ? filterOverrides.level : selectedLevel;
    const topic = filterOverrides.topic !== undefined ? filterOverrides.topic : selectedTopic;

    setIsLoadingScenario(true);
    setTurnIndex(1);
    setSessionReview(null);
    setIsReviewingSession(false);

    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, topic }),
      });
      if (!res.ok) {
        console.warn('[Start Scenario] Server trả về mã lỗi:', res.status);
        return;
      }
      const json = await res.json();

      if (json.success && json.data) {
        const { scenario: sc, firstTurn } = json.data;
        setScenario(sc);
        setCurrentTurn(firstTurn);

        // Khởi tạo dòng lịch sử với câu mở đầu của AI
        setHistory([
          {
            speaker: 'ai',
            text: firstTurn.aiSentence,
            vietnamese: firstTurn.vietnamese,
          },
        ]);

        // Tự động phát âm thanh câu mở đầu của AI
        setTimeout(() => {
          speakJapanese(firstTurn.aiSentence, 1.0);
        }, 400);
      }
    } catch (err) {
      console.error('[Start Scenario Error]', err);
    } finally {
      setIsLoadingScenario(false);
    }
  };

  // 2. Nộp lượt nói (Text-first phản xạ siêu tốc <0.5s)
  const handleSubmitSpeaking = async (audioBlob, spokenText = '') => {
    const actualText = (spokenText || '').trim();
    if (!actualText) {
      console.warn('[handleSubmitSpeaking] Không nhận diện được nội dung nói');
      return;
    }

    setIsEvaluatingSpeaking(true);

    // Ghi nhận chính xác câu nói nhận diện được từ giọng nói vào dòng thời gian
    const userText = actualText;
    const updatedHistory = [
      ...history,
      {
        speaker: 'user',
        text: userText,
      },
    ];
    setHistory(updatedHistory);

    try {
      const res = await fetch('/api/chat/fast-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText: userText,
          turnIndex,
          totalTurns: TOTAL_TURNS,
          history: updatedHistory,
          scenario,
        }),
      });

      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã ${res.status}`);
      }
      const json = await res.json();

      if (json.success && json.data) {
        const { nextTurn, turnIndex: currentTurnIdx, isFinalTurn } = json.data;

        // Cập nhật lượt tiếp theo
        setCurrentTurn(nextTurn);
        const nextIdx = currentTurnIdx + 1;
        setTurnIndex(nextIdx);

        // Thêm câu AI vào lịch sử
        const fullHistory = [
          ...updatedHistory,
          {
            speaker: 'ai',
            text: nextTurn.aiSentence,
            vietnamese: nextTurn.vietnamese,
          },
        ];
        setHistory(fullHistory);

        // Phát âm thanh của AI ngay lập tức
        setTimeout(() => {
          speakJapanese(nextTurn.aiSentence, 1.0);
        }, 200);

        // Nếu chạm lượt N=10 hoặc là lượt kết thúc: Tự động kích hoạt tổng kết
        if (isFinalTurn || nextIdx > TOTAL_TURNS) {
          handleFinishSession(fullHistory);
        }
      }
    } catch (err) {
      console.error('[Fast Turn Error]', err);
      alert('Không thể kết nối đến máy chủ AI: ' + err.message);
    } finally {
      setIsEvaluatingSpeaking(false);
    }
  };

  // 3. Kết thúc hội thoại & Yêu cầu Báo cáo Phân tích Tổng quan
  const handleFinishSession = async (customHistory) => {
    const historyToReview = customHistory || history;
    if (!historyToReview || historyToReview.length < 2) return;

    setIsReviewingSession(true);
    try {
      const res = await fetch('/api/chat/review-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          sessionHistory: historyToReview,
        }),
      });

      if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        setSessionReview(json.data);
      }
    } catch (err) {
      console.error('[Session Review Error]', err);
    } finally {
      setIsReviewingSession(false);
    }
  };

  // Lưu Flashcard mới
  const handleSaveFlashcard = (card) => {
    setFlashcards((prev) => [card, ...prev]);
  };

  // Xóa Flashcard
  const handleDeleteFlashcard = (id) => {
    setFlashcards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* 1. Header */}
      <Header
        apiStatus={apiStatus}
        flashcardCount={flashcards.length}
        onOpenFlashcardModal={() => setIsFlashcardModalOpen(true)}
      />

      {/* 2. Main Workspace Layout: Tỷ Lệ 75% - 25% */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT 1 (75% CHIỀU RỘNG: lg:col-span-9) CHIA THÀNH 2 HÀNG */}
        <section className="lg:col-span-9 flex flex-col gap-6 w-full">
          {/* HÀNG 1: KHU VỰC NGHE - GÕ DICTATION & BẤM MIC NÓI */}
          <DictationSpeakingCard
            scenario={scenario}
            currentTurn={currentTurn}
            turnIndex={turnIndex}
            totalTurns={TOTAL_TURNS}
            selectedLevel={selectedLevel}
            selectedTopic={selectedTopic}
            onLevelChange={(lvl) => {
              setSelectedLevel(lvl);
              handleRandomScenario({ level: lvl });
            }}
            onTopicChange={(tpc) => {
              setSelectedTopic(tpc);
              handleRandomScenario({ topic: tpc });
            }}
            onRandomScenario={() => handleRandomScenario()}
            onSubmitSpeaking={handleSubmitSpeaking}
            onFinishSession={() => handleFinishSession(history)}
            isLoadingScenario={isLoadingScenario}
            isEvaluatingSpeaking={isEvaluatingSpeaking}
            isReviewingSession={isReviewingSession}
          />

          {/* HÀNG 2: BẢNG PHÂN TÍCH CHI TIẾT TỪ GEMINI (AI COACHING) */}
          <AICoachingCard
            turnIndex={turnIndex}
            totalTurns={TOTAL_TURNS}
            sessionReview={sessionReview}
            isReviewingSession={isReviewingSession}
            onFinishSession={() => handleFinishSession(history)}
            onNewScenario={handleRandomScenario}
            onSaveFlashcard={handleSaveFlashcard}
          />
        </section>

        {/* CỘT 2 (25% CHIỀU RỘNG: lg:col-span-3) SIDEBAR TIẾN TRÌNH */}
        <section className="lg:col-span-3 w-full lg:sticky lg:top-20">
          <TimelineSidePanel
            history={history}
            scenario={scenario}
            onSelectTurn={(item) => speakJapanese(item.text, 1.0)}
          />
        </section>
      </main>

      {/* 3. Quick Flashcard Bar khi bôi đen từ vựng */}
      <QuickFlashcardBar
        selection={selection}
        onSave={handleSaveFlashcard}
        onClear={() => setSelection(null)}
      />

      {/* 4. Sổ tay Flashcard Modal */}
      <FlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        flashcards={flashcards}
        onDeleteCard={handleDeleteFlashcard}
      />
    </div>
  );
}
