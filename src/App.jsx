// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DictationSpeakingCard from './components/DictationSpeakingCard';
import AICoachingCard from './components/AICoachingCard';
import TimelineSidePanel from './components/TimelineSidePanel';
import QuickFlashcardBar from './components/QuickFlashcardBar';
import FlashcardModal from './components/FlashcardModal';
import StudyHistoryModal from './components/StudyHistoryModal';
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

  // Kho Chủ Đề Đã Học & Trung Tâm Ôn Tập (Study Archive)
  const [savedSessions, setSavedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('nihonspeak_study_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Lưu Kho Chủ Đề vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('nihonspeak_study_history', JSON.stringify(savedSessions));
    } catch (e) {
      console.error('[LocalStorage Study History Error]', e);
    }
  }, [savedSessions]);

  // Status & Loading States
  const [apiStatus, setApiStatus] = useState({ ok: true, geminiConfigured: false, preferredProvider: 'deepseek' });
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
        setApiStatus({
          ok: true,
          geminiConfigured: data.geminiConfigured,
          preferredProvider: data.preferredProvider || 'deepseek',
        });
      })
      .catch((err) => {
        console.warn('[Health Check Failed]', err);
        setApiStatus({ ok: false, geminiConfigured: false, preferredProvider: 'deepseek' });
      });
  }, []);

  // Đồng bộ hai chiều giữa Cache (localStorage) và Ổ cứng phần cứng (Disk Storage)
  useEffect(() => {
    // 1. Đồng bộ Kho Lịch Sử từ Phần Cứng
    fetch('/api/chat/history')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            setSavedSessions((prev) => {
              const diskIds = new Set(json.data.map((s) => s.id));
              const unmergedLocal = prev.filter((s) => !diskIds.has(s.id));
              return [...json.data, ...unmergedLocal];
            });
          } else if (savedSessions.length > 0) {
            // Nếu ổ cứng trống mà cache trình duyệt có sẵn -> nạp lên ổ cứng
            savedSessions.forEach((s) => {
              fetch('/api/chat/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s),
              }).catch(() => {});
            });
          }
        }
      })
      .catch((err) => console.warn('[Disk History Sync Warning]:', err.message));

    // 2. Đồng bộ Flashcards từ Phần Cứng
    fetch('/api/chat/flashcards')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            setFlashcards((prev) => {
              const diskWords = new Set(json.data.map((f) => f.word || f.kanji));
              const unmergedLocal = prev.filter((f) => !diskWords.has(f.word || f.kanji));
              return [...json.data, ...unmergedLocal];
            });
          } else if (flashcards.length > 0) {
            fetch('/api/chat/flashcards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flashcards }),
            }).catch(() => {});
          }
        }
      })
      .catch((err) => console.warn('[Disk Flashcard Sync Warning]:', err.message));
  }, []);

  // Tự động tải ngữ cảnh ngẫu nhiên ban đầu
  useEffect(() => {
    handleRandomScenario();
  }, []);

  // Bắt sự kiện bôi đen văn bản để hiện QuickFlashcardBar
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Bỏ qua nếu click bên trong QuickFlashcardBar hoặc Flashcard Modal
      if (e.target.closest && (e.target.closest('.quick-flashcard-card') || e.target.closest('.modal-container'))) {
        return;
      }

      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';

      // Kiểm tra có chứa chữ tiếng Nhật (Hiragana, Katakana, Kanji)
      const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(text);
      if (text && hasJapanese && text.length <= 60) {
        let matchedContext = '';
        let matchedMeaning = '';

        const currentAi = currentTurn?.aiSentence || '';
        const currentVi = currentTurn?.vietnamese || '';

        if (currentAi && currentAi.includes(text)) {
          matchedContext = currentAi;
          // Nếu bôi đen toàn bộ câu hoặc gần như trọn câu -> gợi ý trọn nghĩa tiếng Việt
          if (
            currentAi.trim() === text ||
            currentAi.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\-_/]/g, '') ===
              text.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\-_/]/g, '')
          ) {
            matchedMeaning = currentVi;
          }
        } else {
          const found = history?.slice()?.reverse()?.find((h) => h.text && h.text.includes(text));
          if (found) {
            matchedContext = found.text;
            if (
              found.text.trim() === text ||
              found.text.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\-_/]/g, '') ===
                text.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\-_/]/g, '')
            ) {
              matchedMeaning = found.vietnamese || '';
            }
          }
        }

        setSelection({
          text,
          contextSentence: matchedContext,
          suggestedMeaning: matchedMeaning,
        });
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [currentTurn, history]);

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

        // Phát âm thanh của AI ngay lập tức (không delay)
        if (isFinalTurn || nextIdx > TOTAL_TURNS || nextTurn.isCompleted) {
          let hasTriggeredReview = false;
          const triggerFinish = () => {
            if (hasTriggeredReview) return;
            hasTriggeredReview = true;
            handleFinishSession(fullHistory);
          };

          // Phát lời chào kết thúc của AI, sau đó kích hoạt bảng đánh giá tổng kết
          speakJapanese(nextTurn.aiSentence, 1.0, triggerFinish);
          // Fallback timer đề phòng sự kiện onended không kích hoạt
          setTimeout(triggerFinish, 3500);
        } else {
          speakJapanese(nextTurn.aiSentence, 1.0);
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

        // Tự động lưu / cập nhật phiên học vào Kho Lưu Trữ Chủ Đề Đã Học
        const newSessionRecord = {
          id: 'session_' + Date.now(),
          scenarioId: scenario?.scenarioId || ('sc_' + Date.now()),
          scenario: { ...scenario },
          completedAt: new Date().toISOString(),
          turnsCount: historyToReview.length,
          history: [...historyToReview],
          review: { ...json.data },
          flashcards: (json.data.recommendedVocabulary || []).map((v) => ({
            id: 'vocab_' + Date.now() + Math.random().toString(36).slice(2, 6),
            word: v.word,
            reading: v.reading || '',
            meaning: v.meaning || '',
            contextSentence: scenario?.title || '',
            createdAt: new Date().toISOString(),
          })),
        };

        setSavedSessions((prev) => {
          const filtered = prev.filter((s) => s.scenario?.title !== scenario?.title);
          return [newSessionRecord, ...filtered];
        });

        // Ghi lưu trữ vĩnh viễn xuống ổ cứng phần cứng (Disk Storage)
        fetch('/api/chat/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSessionRecord),
        }).catch((err) => console.warn('[Disk Save Session Error]:', err.message));
      }
    } catch (err) {
      console.error('[Session Review Error]', err);
    } finally {
      setIsReviewingSession(false);
    }
  };

  // Quản lý Kho Chủ Đề Đã Học (Ôn tập lại)
  const handleDeleteSession = (id) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
    fetch(`/api/chat/history/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleClearAllSessions = () => {
    setSavedSessions([]);
    fetch('/api/chat/history', { method: 'DELETE' }).catch(() => {});
  };

  const handleReplayScenario = (sessionRecord) => {
    if (!sessionRecord || !sessionRecord.scenario) return;
    const sc = sessionRecord.scenario;
    setScenario(sc);
    setTurnIndex(1);
    setSessionReview(null);
    setIsReviewingSession(false);

    const firstAiTurn = sessionRecord.history?.find((h) => h.speaker === 'ai') || {
      text: 'いらっしゃいませ。',
      vietnamese: 'Kính chào quý khách.',
    };

    const firstTurnObj = {
      aiSentence: firstAiTurn.text,
      vietnamese: firstAiTurn.vietnamese || '',
      replyIdeas: [{ jp: 'はい、お願いします。', vi: 'Vâng, làm phiền bạn ạ.' }],
      isCompleted: false,
    };

    setCurrentTurn(firstTurnObj);
    setHistory([
      {
        speaker: 'ai',
        text: firstAiTurn.text,
        vietnamese: firstAiTurn.vietnamese,
      },
    ]);

    setTimeout(() => {
      speakJapanese(firstAiTurn.text, 1.0);
    }, 400);
  };

  // Lưu Flashcard mới (Đồng bộ cả Cache LocalStorage lẫn Phần Cứng)
  const handleSaveFlashcard = (card) => {
    setFlashcards((prev) => {
      const updated = [card, ...prev];
      fetch('/api/chat/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards: updated }),
      }).catch(() => {});
      return updated;
    });
  };

  // Xóa Flashcard (Đồng bộ cả Cache LocalStorage lẫn Phần Cứng)
  const handleDeleteFlashcard = (id) => {
    setFlashcards((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      fetch('/api/chat/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards: updated }),
      }).catch(() => {});
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* 1. Header */}
      <Header
        apiStatus={apiStatus}
        flashcardCount={flashcards.length}
        onOpenFlashcardModal={() => setIsFlashcardModalOpen(true)}
        savedSessionsCount={savedSessions.length}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
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
            onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
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

      {/* 5. Kho Lưu Trữ Chủ Đề Đã Học & Ôn Tập Modal */}
      <StudyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        savedSessions={savedSessions}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        onReplayScenario={handleReplayScenario}
        onSaveFlashcard={handleSaveFlashcard}
        savedFlashcards={flashcards}
      />
    </div>
  );
}
