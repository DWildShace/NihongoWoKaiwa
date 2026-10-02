// server/services/ttsService.js
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Bộ nhớ cache tạm thời trong RAM cho các câu tiếng Nhật đã phát âm
const audioCache = new Map();

// Bản đồ các giọng đọc tiếng Nhật Neural chuẩn Studio của Microsoft Edge
export const JAPANESE_VOICES = {
  nanami: {
    id: 'ja-JP-NanamiNeural',
    name: 'Nanami (Nữ - Tự nhiên, trong trẻo)',
    gender: 'Female',
  },
  keita: {
    id: 'ja-JP-KeitaNeural',
    name: 'Keita (Nam - Lịch thiệp, chuẩn Tokyo)',
    gender: 'Male',
  },
  aoi: {
    id: 'ja-JP-AoiNeural',
    name: 'Aoi (Nữ - Nhẹ nhàng, êm dịu)',
    gender: 'Female',
  },
  daichi: {
    id: 'ja-JP-DaichiNeural',
    name: 'Daichi (Nam - Trầm ấm, chững chạc)',
    gender: 'Male',
  },
};

/**
 * Tạo âm thanh MP3 từ văn bản tiếng Nhật bằng Microsoft Edge Neural TTS
 * @param {string} text - Văn bản tiếng Nhật cần đọc
 * @param {Object} options
 * @param {string} [options.voice='nanami'] - Giọng đọc ('nanami', 'keita', 'aoi', 'daichi')
 * @param {number} [options.rate=1.0] - Tốc độ đọc (0.75, 1.0, 1.25)
 * @returns {Promise<Buffer>} Buffer tệp âm thanh MP3
 */
export async function synthesizeJapaneseAudio(text = '', options = {}) {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    throw new Error('Văn bản tiếng Nhật không được để trống.');
  }

  const voiceKey = options.voice || 'nanami';
  const voiceConfig = JAPANESE_VOICES[voiceKey] || JAPANESE_VOICES.nanami;
  const voiceId = voiceConfig.id;
  const rate = options.rate || 1.0;

  // Tính tỷ lệ rate sang định dạng phần trăm của Edge TTS (ví dụ rate 0.75 -> '-25%', rate 1.25 -> '+25%')
  let rateParam = '+0%';
  if (rate < 0.9) rateParam = '-20%';
  else if (rate > 1.1) rateParam = '+20%';

  // Khóa cache
  const cacheKey = `${voiceId}_${rateParam}_${cleanText}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Tạo stream âm thanh
  const { audioStream } = await tts.toStream(cleanText, {
    rate: rateParam,
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    audioStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    audioStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      // Lưu vào cache (tối đa 200 câu để không đầy RAM)
      if (audioCache.size > 200) {
        const firstKey = audioCache.keys().next().value;
        audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, buffer);
      resolve(buffer);
    });

    audioStream.on('error', (err) => {
      console.error('[EDGE-TTS ERROR]:', err);
      reject(err);
    });
  });
}
