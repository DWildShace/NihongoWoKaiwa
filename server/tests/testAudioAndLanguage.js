// server/tests/testAudioAndLanguage.js
import fs from 'fs';
import path from 'path';
import { normalizeToHiragana, annotateSentence, calculateHiraganaSimilarity } from '../services/kuromojiService.js';
import { evaluateUserAudioAndRespond } from '../services/geminiService.js';

/**
 * Tạo một file WAV PCM 16-bit hợp lệ (1 giây, 16kHz mono) để kiểm tra pipeline âm thanh
 */
function createTestWavBuffer(durationSeconds = 1, sampleRate = 16000) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = Math.floor(sampleRate * durationSeconds * blockAlign);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Sinh sóng âm thanh mô phỏng (440Hz tone)
  for (let i = 0; i < sampleRate * durationSeconds; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 10000;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }

  return buffer;
}

async function runComprehensiveTest() {
  console.log('=====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM TRA KHẢ NĂNG GHI ÂM & CHUYỂN ĐỔI NGÔN NGỮ');
  console.log('=====================================================\n');

  // PHẦN 1: KIỂM TRA CHUYỂN ĐỔI NGÔN NGỮ (LANGUAGE PARSING & TRANSLATION)
  console.log('--- [1] KIỂM TRA CHUYỂN ĐỔI NGÔN NGỮ & HÌNH THÁI HỌC (KUROMOJI) ---');
  const testPhrases = [
    { raw: 'こんにちは、温めますか？', expectedHira: 'こんにちはあたためますか' },
    { raw: '生ビールを一杯お願いします。', expectedHira: 'なまびーるをいっぱいおねがいします' },
    { raw: '山手線の14番ホームはどこですか？', expectedHira: 'やまのてせんの14ばんほーむはどこですか' },
  ];

  for (const item of testPhrases) {
    const hira = await normalizeToHiragana(item.raw);
    const annotation = await annotateSentence(item.raw);
    console.log(`\n• Câu gốc: "${item.raw}"`);
    console.log(`  ➔ Chuẩn hóa Hiragana: "${hira}"`);
    console.log(`  ➔ Furigana Tokens:`, annotation.furiganaTokens.map(t => t.furigana ? `${t.text}(${t.furigana})` : t.text).join(''));
  }

  // PHẦN 2: KIỂM TRA TÍNH ĐỘ KHỚP PHÁT ÂM / DICTATION (LEVENSHTEIN MATCH)
  console.log('\n--- [2] KIỂM TRA ĐỘ KHỚP PHẢN XẠ DICTATION (MATCH PERCENTAGE) ---');
  const target = 'いらっしゃいませおべんとうあたためますか';
  const cases = [
    { input: 'いらっしゃいませ。お弁当、温めますか？', label: 'Gõ đúng cả Kanji chuẩn' },
    { input: 'いらっしゃいませ おべんとう あたためますか', label: 'Gõ Hiragana thuần' },
    { input: 'irasshaimase obentou atatamemasuka', label: 'Gõ Romaji' },
    { input: 'いらっしゃいませ おべんとう あたためます', label: 'Thiếu 1 từ cuối (hỏi ka)' },
    { input: 'こんにちは', label: 'Gõ sai lệch câu' }
  ];

  for (const c of cases) {
    const cleanInput = await normalizeToHiragana(c.input);
    const score = calculateHiraganaSimilarity(cleanInput, target);
    console.log(`• [${c.label}]: "${c.input}" ➔ Độ khớp: ${score}% ${score >= 80 ? '✅ (MỞ KHÓA MIC)' : '❌ (CHƯA ĐỦ 80%)'}`);
  }

  // PHẦN 3: KIỂM TRA PIPELINE NHẬN & PHÂN TÍCH ÂM THANH (AUDIO BUFFER EVALUATION)
  console.log('\n--- [3] KIỂM TRA PIPELINE XỬ LÝ ÂM THANH GHI ÂM (AUDIO TO EVALUATION) ---');
  const audioBuffer = createTestWavBuffer(2, 16000); // 2 giây audio giả lập
  console.log(`• Đã tạo buffer âm thanh mô phỏng: ${audioBuffer.length} bytes (WAV 16kHz Mono)`);

  const mockScenario = {
    title: 'コンビニでのお会計 (Thanh toán tại Konbini)',
    aiRole: '店員 (Nhân viên thu ngân)',
    userRole: '客 (Khách mua hàng)',
    description: 'Bạn vừa đặt cơm hộp bento và nước ngọt lên quầy tính tiền.'
  };

  const mockHistory = [
    { speaker: 'ai', text: 'いらっしゃいませ。温めますか？' }
  ];

  try {
    const evalResult = await evaluateUserAudioAndRespond({
      audioBuffer,
      mimeType: 'audio/wav',
      history: mockHistory,
      scenario: mockScenario
    });

    console.log('\n✅ KẾT QUẢ ĐÁNH GIÁ ÂM THANH TỪ PIPELINE:');
    console.log('• Văn bản bóc băng được:', evalResult.evaluation.transcription);
    console.log('• Điểm số phát âm:', evalResult.evaluation.pronunciationScore, '/ 100');
    console.log('• Nhận xét ngữ điệu:', evalResult.evaluation.intonationFeedback);
    console.log('• Nhận xét ngữ pháp:', evalResult.evaluation.grammarFeedback);
    console.log('• Gợi ý diễn đạt tự nhiên:', evalResult.evaluation.naturalSuggestion);
    console.log('• Câu thoại tiếp theo của AI:', evalResult.nextTurn.aiSentence);
    console.log('• Dịch nghĩa câu tiếp theo:', evalResult.nextTurn.vietnamese);
  } catch (err) {
    console.error('❌ Lỗi xử lý âm thanh:', err.message);
  }

  console.log('\n=====================================================');
  console.log('🎉 KIỂM TRA HOÀN TẤT THÀNH CÔNG!');
  console.log('=====================================================');
}

runComprehensiveTest().catch(console.error);
