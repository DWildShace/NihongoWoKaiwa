// src/components/DictationSpeakingCard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as wanakana from 'wanakana';
import {
  Dice5,
  Volume2,
  Mic,
  MicOff,
  Lock,
  Unlock,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Keyboard,
  X,
  Command,
} from 'lucide-react';
import AudioPlayerWidget from './AudioPlayerWidget';
import { computeRealtimeMatch } from '../utils/similarity';
import { playUnlockSuccessSound, playRecordStartSound, speakJapanese } from '../utils/soundEffects';
import { AudioRecorder } from '../utils/audioRecorder';

export default function DictationSpeakingCard({
  scenario,
  currentTurn,
  turnIndex = 1,
  totalTurns = 10,
  selectedLevel = 'all',
  selectedTopic = 'all',
  conversationMode = 'roleplay',
  onModeChange,
  onLevelChange,
  onTopicChange,
  onRandomScenario,
  onSubmitSpeaking,
  onFinishSession,
  isLoadingScenario,
  isEvaluatingSpeaking,
  isReviewingSession,
}) {
  // Dictation States
  const [typedInput, setTypedInput] = useState('');
  const [matchScore, setMatchScore] = useState(0);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [dictationAttempts, setDictationAttempts] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  // Speaking States
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [showReplyIdeas, setShowReplyIdeas] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [recorderError, setRecorderError] = useState('');

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Khi lượt hội thoại mới đến -> Reset trạng thái
  useEffect(() => {
    setTypedInput('');
    setMatchScore(0);
    setHasUnlocked(false);
    setShowHint(false);
    setDictationAttempts(0);
    setIsRecording(false);
    setRecordDuration(0);
    setRecorderError('');
    setShowReplyIdeas(false);
    setLiveTranscript('');
    transcriptRef.current = '';
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
  }, [currentTurn?.aiSentence]);

  // Ref lưu vị trí con trỏ chuột khi chỉnh sửa ở giữa câu dài
  const cursorPositionRef = useRef(null);

  // Khôi phục chính xác vị trí con trỏ chuột sau khi React re-render
  useEffect(() => {
    if (cursorPositionRef.current !== null && inputRef.current) {
      const pos = Math.min(cursorPositionRef.current, inputRef.current.value.length);
      try {
        inputRef.current.setSelectionRange(pos, pos);
      } catch (e) {}
      cursorPositionRef.current = null;
    }
  }, [typedInput]);

  // Tính % độ khớp thời gian thực khi người dùng gõ, tự động chuyển đổi Romaji -> Hiragana
  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    const start = e.target.selectionStart;

    // Chuyển đổi Romaji -> Hiragana thời gian thực (IMEMode: true giữ nguyên phụ âm dở dang như k, s, t)
    const converted = wanakana.toKana(rawVal, { IMEMode: true });

    // Tính toán độ lệch vị trí con trỏ nếu có hợp nhất ký tự Romaji -> Hiragana (ví dụ: 'ka' -> 'か')
    if (converted !== rawVal) {
      const diff = rawVal.length - converted.length;
      cursorPositionRef.current = Math.max(0, (start || 0) - diff);
    } else {
      cursorPositionRef.current = start;
    }

    setTypedInput(converted);

    const targetHira = currentTurn?.normalizedHiragana || currentTurn?.reading || '';
    const score = computeRealtimeMatch(converted, targetHira);
    setMatchScore(score);

    // Kiểm tra mở khóa 80%
    if (score >= 80 && !hasUnlocked) {
      setHasUnlocked(true);
      playUnlockSuccessSound();
    }
  };

  // Hỗ trợ dán (Paste) - Chuyển toàn bộ đoạn văn bản Romaji dán vào thành Hiragana ngay lập tức
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData ? e.clipboardData.getData('text') : '';
    if (!pastedText) return;

    const convertedPaste = wanakana.toKana(pastedText);
    const textarea = inputRef.current;
    const start = textarea ? textarea.selectionStart : typedInput.length;
    const end = textarea ? textarea.selectionEnd : typedInput.length;
    const current = typedInput;
    const nextVal = current.substring(0, start) + convertedPaste + current.substring(end);

    cursorPositionRef.current = start + convertedPaste.length;
    setTypedInput(nextVal);

    const targetHira = currentTurn?.normalizedHiragana || currentTurn?.reading || '';
    const score = computeRealtimeMatch(nextVal, targetHira);
    setMatchScore(score);

    if (score >= 80 && !hasUnlocked) {
      setHasUnlocked(true);
      playUnlockSuccessSound();
    }
  };

  // Tự động chuyển n cuối cùng thành ん khi rời khỏi ô nhập liệu
  const handleBlur = () => {
    if (typedInput && /[a-zA-Z]/.test(typedInput)) {
      const converted = wanakana.toHiragana(typedInput);
      if (converted !== typedInput) {
        setTypedInput(converted);
        const targetHira = currentTurn?.normalizedHiragana || currentTurn?.reading || '';
        const score = computeRealtimeMatch(converted, targetHira);
        setMatchScore(score);
        if (score >= 80 && !hasUnlocked) {
          setHasUnlocked(true);
          playUnlockSuccessSound();
        }
      }
    }
  };

  // Nút thủ công chuyển đổi toàn bộ Romaji sang Hiragana nếu cần
  const handleConvertToHiragana = () => {
    if (!typedInput) return;
    const converted = wanakana.toHiragana(typedInput);
    setTypedInput(converted);
    const targetHira = currentTurn?.normalizedHiragana || currentTurn?.reading || '';
    const score = computeRealtimeMatch(converted, targetHira);
    setMatchScore(score);
    if (score >= 80 && !hasUnlocked) {
      setHasUnlocked(true);
      playUnlockSuccessSound();
    }
  };

  // Nút xóa nhanh nội dung để gõ lại từ đầu
  const handleClearInput = () => {
    setTypedInput('');
    setMatchScore(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // State và Ref lưu câu tiếng Nhật đang nhận diện trực tiếp từ giọng nói
  const [liveTranscript, setLiveTranscript] = useState('');
  const transcriptRef = useRef('');
  const recognitionRef = useRef(null);

  // Bắt đầu ghi âm
  const handleStartRecording = async () => {
    setRecorderError('');
    setLiveTranscript('');
    transcriptRef.current = '';
    try {
      playRecordStartSound();

      // 1. Khởi động Web Audio Recorder
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start((vol) => {
        setMicVolume(vol);
      });

      // 2. Khởi động Web Speech Recognition song song để nhận diện chính xác câu người học nói
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = 'ja-JP';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript;
            }
            if (fullText) {
              const cleaned = fullText.trim();
              transcriptRef.current = cleaned;
              setLiveTranscript(cleaned);
            }
          };
          rec.onerror = (e) => {
            console.warn('[SpeechRecognition Notice]', e.error);
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn('[SpeechRecognition Init]', e);
        }
      }

      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[Mic Error]', err);
      setRecorderError('Không thể truy cập Microphone: ' + err.message);
    }
  };

  // Dừng ghi âm và nộp bài
  const handleStopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (!recorderRef.current || !isRecording) return;
    setIsRecording(false);

    try {
      const { blob, duration } = await recorderRef.current.stop();
      const finalTranscript = (transcriptRef.current || liveTranscript || '').trim();

      if (duration < 0.5 && !finalTranscript) {
        setRecorderError('Thời lượng nói quá ngắn. Bạn vui lòng giữ mic và nói to hơn nhé!');
        return;
      }

      if (!finalTranscript) {
        setRecorderError('Chưa nhận diện được câu nói của bạn. Bạn vui lòng nói lại rõ ràng hơn nhé!');
        return;
      }

      // Gửi cả file âm thanh lẫn câu nói nhận diện được trực tiếp từ trình duyệt
      if (onSubmitSpeaking) {
        onSubmitSpeaking(blob, finalTranscript);
      }
    } catch (err) {
      console.error('[Stop Record Error]', err);
      setRecorderError('Lỗi khi xử lý file âm thanh: ' + err.message);
    }
  };

  // Hủy phiên ghi âm hiện tại (không gửi, không lưu)
  const handleCancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.cancel();
    }

    setIsRecording(false);
    setRecordDuration(0);
    setMicVolume(0);
    setLiveTranscript('');
    transcriptRef.current = '';
    setRecorderError('');
  };

  // Reset câu trả lời bị đọc nhầm và bắt đầu ghi âm lại ngay lập tức
  const handleResetRecording = async () => {
    if (!isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.cancel();
    }

    setRecordDuration(0);
    setMicVolume(0);
    setLiveTranscript('');
    transcriptRef.current = '';
    setRecorderError('');

    try {
      playRecordStartSound();

      // 1. Khởi động Web Audio Recorder mới
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start((vol) => {
        setMicVolume(vol);
      });

      // 2. Khởi động Web Speech Recognition mới
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = 'ja-JP';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript;
            }
            if (fullText) {
              const cleaned = fullText.trim();
              transcriptRef.current = cleaned;
              setLiveTranscript(cleaned);
            }
          };
          rec.onerror = (e) => {
            if (e.error === 'aborted') return;
            console.warn('[SpeechRecognition Notice]', e.error);
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn('[SpeechRecognition Init]', e);
        }
      }

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[Reset Recording Error]', err);
      setRecorderError('Không thể khởi động lại Microphone: ' + err.message);
      setIsRecording(false);
    }
  };

  // Lắng nghe Phím tắt toàn cục (Keyboard Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      // 1. Phím tắt Phát / Dừng âm thanh:
      // - Nếu đang ở trong ô gõ input: Bấm Ctrl + Space để phát (để phím Space thường dùng gõ Romaji/Hiragana)
      // - Nếu đang ở ngoài ô input: Bấm Space hoặc Ctrl + Space
      if (
        (e.code === 'Space' && (e.ctrlKey || e.metaKey)) ||
        (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey && !isInputFocused)
      ) {
        e.preventDefault();
        audioPlayerRef.current?.togglePlay();
        return;
      }

      // 2. Phím tắt Bật / Tắt Mic: Ctrl + M
      if ((e.key === 'm' || e.key === 'M') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (hasUnlocked && !isEvaluatingSpeaking && !currentTurn?.isCompleted) {
          if (isRecording) {
            handleStopRecording();
          } else {
            handleStartRecording();
          }
        }
        return;
      }

      // 3. Phím tắt Reset đọc lại câu trả lời: Ctrl + R (khi đang ghi âm)
      if ((e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey)) {
        if (isRecording) {
          e.preventDefault();
          handleResetRecording();
          return;
        }
      }

      // 4. Phím tắt Bật / Tắt Gợi ý: Ctrl + H
      if ((e.key === 'h' || e.key === 'H') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (hasUnlocked) {
          setShowReplyIdeas((prev) => !prev);
        } else {
          setShowHint((prev) => !prev);
        }
        return;
      }

      // 5. Phím tắt Đổi kịch bản ngẫu nhiên: Alt + N
      if ((e.key === 'n' || e.key === 'N') && e.altKey) {
        e.preventDefault();
        if (!isLoadingScenario && !isRecording && !isEvaluatingSpeaking && onRandomScenario) {
          onRandomScenario();
        }
        return;
      }

      // 6. Phím Escape: Hủy ghi âm (không nộp bài), dừng phát âm thanh, tắt modal phím tắt
      if (e.key === 'Escape') {
        audioPlayerRef.current?.stop();
        if (isRecording) {
          handleCancelRecording();
        }
        setShowShortcutsModal(false);
        return;
      }

      // 7. Phím F1 hoặc Ctrl + /: Bật/Tắt bảng tra cứu phím tắt
      if (e.key === 'F1' || ((e.key === '/' || e.key === '?') && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    hasUnlocked,
    isRecording,
    isEvaluatingSpeaking,
    isLoadingScenario,
    onRandomScenario,
  ]);

  const targetHira = currentTurn?.normalizedHiragana || currentTurn?.reading || '';

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-6 relative">
      {/* 1. SCENARIO BANNER & FILTERS */}
      <div className="space-y-3.5 pb-5 border-b border-slate-800/80">
        {/* BỘ CHỌN CHẾ ĐỘ HỘI THOẠI: ROLEPLAY vs DEEP TALK */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
              Chế độ:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => onModeChange && onModeChange('roleplay')}
                disabled={isLoadingScenario || isRecording || isEvaluatingSpeaking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  conversationMode === 'roleplay'
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tình huống thực tế đời sống (Konbini, nhà hàng, ga tàu, phỏng vấn...)"
              >
                <span>⚡ Tình huống thực tế (Roleplay)</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange && onModeChange('deep_talk')}
                disabled={isLoadingScenario || isRecording || isEvaluatingSpeaking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  conversationMode === 'deep_talk'
                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Trò chuyện sâu, làm quen bạn mới, hỏi đáp hai chiều và chia sẻ sở thích"
              >
                <span>☕ Giao tiếp sâu & Làm quen (Deep Talk)</span>
              </button>
            </div>
          </div>

          {conversationMode === 'deep_talk' ? (
            <div className="text-[11px] font-medium text-indigo-300/90 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Hỏi đáp 2 chiều: Bạn có thể tự do hỏi ngược lại AI (ví dụ: 「〜さんは？」) để kết bạn!</span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-slate-400 px-2">
              Luyện phản xạ xử lý tình huống giao dịch đời sống
            </div>
          )}
        </div>

        {/* THANH BỘ LỌC CẤP ĐỘ JLPT & CHỦ ĐỀ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          {/* Cấp độ JLPT */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Trình độ:
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'N5', label: 'N5 Sơ cấp' },
              { id: 'N4', label: 'N4 Giao tiếp' },
              { id: 'N3', label: 'N3 Trung cấp' },
              { id: 'N2', label: 'N2 Công sở' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onLevelChange && onLevelChange(lvl.id)}
                disabled={isLoadingScenario || isRecording || isEvaluatingSpeaking}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl.id
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/25 scale-105'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Chủ đề */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chủ đề:
            </span>
            <select
              value={selectedTopic}
              onChange={(e) => onTopicChange && onTopicChange(e.target.value)}
              disabled={isLoadingScenario || isRecording || isEvaluatingSpeaking}
              className="bg-slate-900 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">🎲 Mọi chủ đề</option>
              <optgroup label="☕ Giao tiếp sâu & Làm quen kết bạn">
                <option value="social">🤝 Làm quen & Kết bạn mới (自己紹介・初対面)</option>
                <option value="chitchat">☕ Tán gẫu & Đời sống (雑談・趣味・週末)</option>
                <option value="deep_talk">🌸 Trò chuyện sâu & Tâm sự (深い対話・日本生活)</option>
                <option value="entertainment">🍜 Ẩm thực & Giải trí (グルメ・映画・音楽)</option>
              </optgroup>
              <optgroup label="🏪 Tình huống thực tế đời sống">
                <option value="daily">🏪 Cửa hàng tiện lợi & Mua sắm (コンビニ・買い物)</option>
                <option value="dining">🍜 Nhà hàng & Quán ăn (飲食店・注文)</option>
                <option value="travel">🚆 Du lịch & Ga tàu (旅行・駅・道案内)</option>
                <option value="business">💼 Công sở & Phỏng vấn (ビジネス・面接)</option>
                <option value="medical">🏥 Y tế & Thủ tục (病院・手続き)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Thanh tiến trình & Nút chức năng */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {scenario?.mode === 'deep_talk' || conversationMode === 'deep_talk' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-pink-500/20 text-indigo-200 border border-indigo-500/40">
                ☕ Giao tiếp sâu & Làm quen
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                ⚡ Tình huống thực tế
              </span>
            )}
            {scenario?.level && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                JLPT {scenario.level}
              </span>
            )}
            {/* Huy hiệu tiến trình lượt 1/10 */}
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm transition-all ${
                currentTurn?.isCompleted
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {currentTurn?.isCompleted
                ? `🎉 Hoàn thành (${Math.min(turnIndex, totalTurns)}/${totalTurns} lượt)`
                : `Hội thoại: Lượt ${Math.min(turnIndex, totalTurns)} / ${totalTurns}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Bảng Phím Tắt */}
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-sm"
              title="Xem danh sách phím tắt (F1 hoặc Ctrl+/)"
            >
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phím tắt</span>
            </button>

            {/* Nút Hoàn thành sớm (chỉ hiện khi hội thoại chưa kết thúc) */}
            {turnIndex >= 2 && onFinishSession && !currentTurn?.isCompleted && (
              <button
                onClick={onFinishSession}
                disabled={isReviewingSession || isEvaluatingSpeaking}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                title="Dừng hội thoại tại đây và xem bản nhận xét tổng kết của AI"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isReviewingSession ? 'Đang tổng kết...' : 'Hoàn thành & Xem nhận xét'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh tiến độ 10 lượt */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${currentTurn?.isCompleted ? 100 : (Math.min(turnIndex, totalTurns) / totalTurns) * 100}%` }}
          />
        </div>

        {/* Tiêu đề tình huống & Nút Random */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              AI: <strong className="text-slate-200">{scenario?.aiRole || 'Đối tác'}</strong> | Bạn: <strong className="text-slate-200">{scenario?.userRole || 'Học viên'}</strong>
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight font-jp">
              {scenario?.title || 'Đang tải tình huống...'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {scenario?.description || 'Bấm nút Random để bắt đầu một tình huống giao tiếp đời sống bất kỳ.'}
            </p>
          </div>

          {/* Nút Random Ngữ Cảnh */}
          <button
            onClick={onRandomScenario}
            disabled={isLoadingScenario || isRecording || isEvaluatingSpeaking || isReviewingSession}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
            title="Đổi ngữ cảnh ngẫu nhiên (Alt + N)"
          >
            <Dice5 className={`w-4 h-4 ${isLoadingScenario ? 'animate-spin' : ''}`} />
            <span>{isLoadingScenario ? 'Đang tạo...' : '🎲 Random ngữ cảnh'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-sans font-bold rounded bg-black/30 text-white/90 border border-white/20">
              Alt+N
            </kbd>
          </button>
        </div>
      </div>

      {/* NẾU HỘI THOẠI ĐÃ ĐẠT ĐIỂM DỪNG TỰ NHIÊN / HOÀN THÀNH */}
      {currentTurn?.isCompleted ? (
        <div className="rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/40 space-y-6 text-center animate-fadeIn shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Điểm dừng tự nhiên đã đạt được
            </span>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              🎉 Cuộc hội thoại đã kết thúc thành công!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Mục tiêu giao tiếp của tình huống đã được giải quyết trọn vẹn ({Math.min(turnIndex, totalTurns)} lượt). Hai bên đã trao đổi lời chào kết thúc phù hợp với văn hóa Nhật Bản.
            </p>
          </div>

          {/* Hộp hiển thị câu chào kết thúc của AI */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-left space-y-2.5 max-w-xl mx-auto shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {scenario?.aiRole || 'Đối tác'} (Lời chào kết thúc):
              </span>
              <button
                type="button"
                onClick={() => speakJapanese(currentTurn?.aiSentence, 1.0)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe lại phát âm</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-jp font-bold text-white leading-relaxed">
              {currentTurn?.aiSentence}
            </p>
            {currentTurn?.vietnamese && (
              <p className="text-xs sm:text-sm text-slate-400 italic">
                {currentTurn.vietnamese}
              </p>
            )}
          </div>

          {/* Trạng thái Tổng kết AI */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 max-w-xl mx-auto flex items-center justify-center gap-2.5 text-xs text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-spin" />
            <span>
              {isReviewingSession
                ? 'Gemini Master Coach đang phân tích toàn bộ diễn biến các lượt nói...'
                : 'Bản nhận xét đánh giá toàn diện & Flashcard đã sẵn sàng bên dưới 👇'}
            </span>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onRandomScenario}
              disabled={isLoadingScenario}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm transition-all shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Dice5 className="w-4 h-4" />
              <span>🎲 Luyện tình huống mới</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. BƯỚC 1: NGHE & GÕ DICTATION (≥ 80%) */}
          <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
              1
            </span>
            <h3 className="text-sm font-semibold text-slate-200">
              Bước 1: Nghe âm thanh AI và gõ lại câu thoại
            </h3>
          </div>

          {/* Huy hiệu độ khớp % */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Độ khớp:</span>
            <span
              className={`text-sm font-black px-2.5 py-0.5 rounded-full border transition-all ${
                matchScore >= 80
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : matchScore > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {matchScore}% / 80%
            </span>
          </div>
        </div>

        {/* Audio Player Widget kết nối Ref */}
        <AudioPlayerWidget
          ref={audioPlayerRef}
          text={currentTurn?.aiSentence || ''}
          speed={speed}
          onSpeedChange={(r) => setSpeed(r)}
        />

        {/* VÙNG GÕ DICTATION THÔNG MINH - HỖ TRỢ CÂU DÀI & KHÔNG CHE CHỮ */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border transition-all ${
            matchScore >= 80
              ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
              : 'border-slate-700/80 focus-within:border-amber-500/70 focus-within:ring-1 focus-within:ring-amber-500/20'
          }`}
        >
          {/* Ô nhập liệu tự động co giãn theo độ dài câu, không bao giờ bị cắt cụt chữ */}
          <textarea
            ref={inputRef}
            rows={Math.min(4, Math.max(2, Math.ceil((typedInput.length || 1) / 38)))}
            value={typedInput}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder="Gõ Romaji hoặc Hiragana những gì bạn vừa nghe... (Mục tiêu ≥80%)"
            className="w-full bg-transparent text-base sm:text-lg font-jp text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed tracking-wide"
          />

          {/* Thanh công cụ chân ô gõ (Độc lập, không bao giờ đè lên chữ) */}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-3 text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">
                {typedInput.length} ký tự
              </span>
              {typedInput && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xóa nhanh để gõ lại từ đầu"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa làm lại</span>
                </button>
              )}
              {typedInput && (wanakana.toHiragana(typedInput) !== typedInput) && (
                <button
                  type="button"
                  onClick={handleConvertToHiragana}
                  className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer shadow-sm animate-pulse"
                  title="Chuyển đổi toàn bộ chữ Romaji trong ô sang Hiragana"
                >
                  <span>🈸 Đổi sang Hiragana</span>
                </button>
              )}
            </div>

            {/* Trạng thái Đạt chuẩn hoặc Nút Gợi ý */}
            <div className="flex items-center gap-2">
              {matchScore >= 80 ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-sm animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn (Mở khóa Mic)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                  title="Gợi ý âm đọc nếu bí (Ctrl + H)"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Gợi ý âm đọc</span>
                  <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-sans font-bold rounded bg-black/40 text-amber-300/80">Ctrl+H</kbd>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Thanh Progress Bar đo độ khớp */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              matchScore >= 80
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-500 to-rose-500'
            }`}
            style={{ width: `${Math.min(100, matchScore)}%` }}
          />
        </div>

        {/* Khung Gợi ý nếu người học bấm nút Gợi ý ở Bước 1 */}
        {showHint && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Gợi ý âm đọc:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHint(false)}
                className="text-amber-400/80 hover:text-amber-200 text-xs px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>
            <p className="font-jp text-sm tracking-wide">
              {targetHira || currentTurn?.reading || 'Chưa có phiên âm.'}
            </p>
            <p className="text-[11px] text-amber-300/80">
              Dịch nghĩa: {currentTurn?.vietnamese || '...'}
            </p>
          </div>
        )}
      </div>

      {/* 3. BƯỚC 2: NÓI PHẢN XẠ QUA MICROPHONE */}
      <div className="pt-4 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                hasUnlocked
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              2
            </span>
            <h3 className="text-sm font-semibold text-slate-200">
              Bước 2: Bấm Micro và nói câu trả lời tiếng Nhật
            </h3>
          </div>

          {/* Nút Xem Gợi Ý Câu Đáp (CHỈ HIỆN KHI ĐÃ ĐẠT BƯỚC 1 VÀ CÓ DỮ LIỆU) */}
          {hasUnlocked && currentTurn?.replyIdeas && currentTurn.replyIdeas[0] && (
            <button
              type="button"
              onClick={() => setShowReplyIdeas((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                showReplyIdeas
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sky-500/20'
                  : 'bg-slate-800/90 hover:bg-slate-700/80 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
              }`}
              title="Bật/Tắt xem gợi ý câu đáp (Ctrl + H)"
            >
              <Lightbulb className={`w-3.5 h-3.5 ${showReplyIdeas ? 'text-sky-300' : 'text-amber-400'}`} />
              <span>
                {showReplyIdeas
                  ? 'Ẩn gợi ý'
                  : conversationMode === 'deep_talk'
                  ? '💡 Gợi ý trả lời & hỏi lại'
                  : '💡 Xem gợi ý câu đáp'}
              </span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-sans font-bold rounded bg-black/40 text-slate-300 border border-slate-600/50">
                Ctrl+H
              </kbd>
            </button>
          )}
        </div>

        {/* KHUNG GỢI Ý CÂU ĐÁP - CHỈ ĐƯỢC HIỆN RA KHI BẤM NÚT GỢI Ý */}
        {hasUnlocked && showReplyIdeas && currentTurn?.replyIdeas && currentTurn.replyIdeas[0] && (
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-start gap-3 animate-fadeIn">
            <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                  Gợi ý cách đối đáp tự nhiên:
                </div>
                <button
                  type="button"
                  onClick={() => setShowReplyIdeas(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Thu gọn gợi ý"
                >
                  ✕ Thu gọn
                </button>
              </div>
              <p className="font-jp font-bold text-sky-200 text-sm">
                {currentTurn.replyIdeas[0].jp}
              </p>
              <p className="text-slate-400 text-xs">
                {currentTurn.replyIdeas[0].vi}
              </p>
            </div>
          </div>
        )}

        {/* VÙNG NÚT MICROPHONE (Được khóa nếu < 80%) */}
        <div className="relative rounded-2xl p-6 bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center text-center overflow-hidden">
          {!hasUnlocked ? (
            /* TRẠNG THÁI KHÓA */
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-400 max-w-sm">
                Micro đang khóa. Hãy hoàn thành <strong>Bước 1</strong> (đạt ít nhất 80% độ khớp) để mở khóa quyền nói.
              </p>
            </div>
          ) : (
            /* TRẠNG THÁI MỞ KHÓA */
            <div className="flex flex-col items-center gap-3 py-2 w-full">
              {recorderError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recorderError}</span>
                </div>
              )}

              {/* Nút Micro tròn to bản */}
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isEvaluatingSpeaking}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                  isRecording
                    ? 'bg-rose-600 text-white mic-recording-pulse'
                    : isEvaluatingSpeaking
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white hover:scale-105 shadow-rose-500/30 hover:shadow-rose-500/50'
                }`}
                title={isRecording ? 'Bấm để dừng và nộp bài (Ctrl + M)' : 'Bấm để bắt đầu thu âm (Ctrl + M)'}
              >
                {isRecording ? (
                  <Mic className="w-9 h-9" />
                ) : isEvaluatingSpeaking ? (
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}

                {/* Sóng âm thanh động hiển thị biên độ khi đang nói */}
                {isRecording && (
                  <div
                    className="absolute inset-0 rounded-full border-2 border-rose-400 transition-all pointer-events-none"
                    style={{
                      transform: `scale(${1 + (micVolume / 100) * 0.3})`,
                      opacity: 0.8,
                    }}
                  />
                )}
              </button>

              {/* Phím tắt badge cho Mic */}
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 text-[11px] font-sans font-bold rounded-lg bg-slate-900/90 text-slate-300 border border-slate-700/80 shadow-sm">
                  Ctrl + M
                </kbd>
              </div>

              {/* Nhãn trạng thái & Câu nhận diện thời gian thực */}
              <div className="space-y-1.5 max-w-md mx-auto">
                <p className="text-sm font-bold text-slate-200">
                  {isRecording
                    ? `Đang lắng nghe bạn nói... (${recordDuration}s)`
                    : isEvaluatingSpeaking
                    ? 'AI đang lắng nghe và phân tích phát âm...'
                    : 'Bấm vào Micro hoặc nhấn Ctrl+M để nói tiếng Nhật'}
                </p>

                {/* Hiển thị câu tiếng Nhật nhận diện được theo thời gian thực */}
                {isRecording && liveTranscript && (
                  <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-jp font-bold text-base animate-pulse">
                    "{liveTranscript}"
                  </div>
                )}

                {/* THANH CÔNG CỤ RESET / HỦY KHI ĐANG GHI ÂM (DÀNH CHO KHI ĐỌC NHẦM) */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-2.5 pt-1.5 flex-wrap animate-fadeIn">
                    <button
                      type="button"
                      onClick={handleResetRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                      title="Xóa câu vừa đọc sai và bắt đầu đọc lại ngay (Ctrl + R)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>🔄 Đọc lại từ đầu</span>
                      <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/40 text-amber-200 border border-amber-500/40">
                        Ctrl+R
                      </kbd>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                      title="Hủy bỏ lượt nói này, không nộp bài cho AI (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>✕ Hủy bỏ</span>
                      <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/40 text-slate-300 border border-slate-600/40">
                        Esc
                      </kbd>
                    </button>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  {isRecording
                    ? 'Bấm lại vào Micro (hoặc Ctrl+M) để hoàn thành và gửi bài'
                    : 'Nói rõ ràng từng âm, chú ý âm ngắt và trường âm'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* 4. MODAL HƯỚNG DẪN PHÍM TẮT (KEYBOARD SHORTCUTS MODAL) */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 space-y-5 text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Keyboard className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Bảng Phím Tắt Luyện Tập</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Danh sách phím tắt */}
            <div className="space-y-3 text-sm">
              {[
                {
                  keys: ['Space', 'Ctrl + Space'],
                  desc: 'Phát / Dừng âm thanh câu thoại AI (TTS)',
                  note: 'Khi đang ở ô gõ chữ, dùng Ctrl + Space',
                },
                {
                  keys: ['Ctrl + M'],
                  desc: 'Bật / Tắt Microphone (bắt đầu nói & nộp bài)',
                  note: 'Hoạt động khi đã hoàn thành Bước 1 (≥80%)',
                },
                {
                  keys: ['Ctrl + R'],
                  desc: 'Reset & Đọc lại câu trả lời từ đầu (khi đọc nhầm)',
                  note: 'Xóa câu vừa đọc sai, bắt đầu lượt nói mới ngay tức thì',
                },
                {
                  keys: ['Ctrl + H'],
                  desc: 'Bật / Tắt xem Gợi ý (Bước 1: Âm đọc | Bước 2: Câu đáp)',
                  note: 'Giúp bạn tự tư duy trước khi cần trợ giúp',
                },
                {
                  keys: ['Alt + N'],
                  desc: 'Đổi ngẫu nhiên tình huống / ngữ cảnh mới',
                  note: 'Random kịch bản theo trình độ & chủ đề đã chọn',
                },
                {
                  keys: ['Esc'],
                  desc: 'Hủy ghi âm (không nộp bài) / Dừng âm thanh / Đóng hộp thoại',
                  note: 'Hủy tác vụ đang chạy an toàn mà không nộp bài nhầm',
                },
                {
                  keys: ['F1', 'Ctrl + /'],
                  desc: 'Mở / Đóng bảng phím tắt này',
                  note: 'Tra cứu nhanh bất cứ lúc nào',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 text-xs lg:text-sm">
                      {item.desc}
                    </div>
                    {item.note && (
                      <div className="text-[11px] text-slate-400">{item.note}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {item.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-300 shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Đã hiểu (Bấm Esc để đóng)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
