// src/utils/soundEffects.js

/**
 * Hiệu ứng âm thanh khi mở khóa thành công ≥ 80%
 */
export function playUnlockSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, now); // C4
    osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.35);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('[AudioContext Unlock Sound Error]', e);
  }
}

/**
 * Hiệu ứng âm thanh khi bấm nút bắt đầu ghi âm
 */
export function playRecordStartSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn('[AudioContext Record Sound Error]', e);
  }
}

// Đối tượng Audio đang phát hiện tại
let currentAudioPlayer = null;

/**
 * Dừng mọi âm thanh tiếng Nhật đang phát
 */
export function stopSpeaking() {
  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer.currentTime = 0;
    currentAudioPlayer = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Dự phòng qua Web Speech API của trình duyệt nếu mất mạng
 */
function speakJapaneseBrowserFallback(text, rate = 1.0, onEnd) {
  if (!window.speechSynthesis || !text) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate || 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const jpVoice =
    voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja')) ||
    voices.find((v) => v.name.includes('Japanese') || v.name.includes('Nanami') || v.name.includes('Kyoko'));

  if (jpVoice) {
    utterance.voice = jpVoice;
  }

  utterance.onend = () => {
    if (typeof onEnd === 'function') onEnd();
  };
  utterance.onerror = (e) => {
    if (typeof onEnd === 'function') onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Phát âm thanh tiếng Nhật chuẩn Studio bằng Microsoft Edge Neural TTS
 * Giọng đọc tự nhiên bản xứ 100%, có ngữ điệu cảm xúc và pitch accent Tokyo
 * @param {string} text - Câu tiếng Nhật cần đọc
 * @param {number} [rate=1.0] - Tốc độ đọc (0.75, 1.0, 1.25)
 * @param {() => void} [onEnd] - Callback khi đọc xong
 * @param {string} [voice] - Giọng ('nanami' | 'keita' | 'aoi' | 'daichi')
 */
export function speakJapanese(text = '', rate = 1.0, onEnd, voice) {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // Dừng âm thanh cũ
  stopSpeaking();

  // Lấy giọng từ localStorage nếu không truyền vào
  let selectedVoice = voice;
  if (!selectedVoice) {
    try {
      selectedVoice = localStorage.getItem('nihonspeak_tts_voice') || 'nanami';
    } catch {
      selectedVoice = 'nanami';
    }
  }

  // URL gọi Microsoft Edge Neural TTS từ backend
  const audioUrl = `/api/chat/tts?text=${encodeURIComponent(cleanText)}&voice=${selectedVoice}&rate=${rate || 1.0}`;
  const audio = new Audio(audioUrl);
  currentAudioPlayer = audio;

  audio.onended = () => {
    currentAudioPlayer = null;
    if (typeof onEnd === 'function') onEnd();
  };

  audio.onerror = (err) => {
    console.warn('[Edge TTS Fallback to WebSpeech]', err);
    currentAudioPlayer = null;
    speakJapaneseBrowserFallback(cleanText, rate, onEnd);
  };

  audio.play().catch((playErr) => {
    console.warn('[Audio Play Error, fallbacking...]', playErr);
    currentAudioPlayer = null;
    speakJapaneseBrowserFallback(cleanText, rate, onEnd);
  });
}
