// server/tests/testKuromoji.js
import { normalizeToHiragana, annotateSentence, calculateHiraganaSimilarity } from '../services/kuromojiService.js';

async function runTests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ KUROMOJI SERVICE ---');

  // Test 1: Chuẩn hóa Kanji sang Hiragana
  const sentence = '何かお探しですか？';
  const hira = await normalizeToHiragana(sentence);
  console.log(`[Test 1] Gốc: "${sentence}" => Hiragana: "${hira}"`);
  if (hira.includes('なにかおさがしですか')) {
    console.log('✅ Test 1 PASSED: Chuẩn hóa Kanji -> Hiragana thành công.');
  } else {
    console.error('❌ Test 1 FAILED');
  }

  // Test 2: Annotate Furigana
  const annotated = await annotateSentence('温めますか？');
  console.log('[Test 2] Furigana tokens:', JSON.stringify(annotated.furiganaTokens));
  if (annotated.furiganaTokens.some(t => t.text === '温' && t.furigana === 'あたた')) {
    console.log('✅ Test 2 PASSED: Bóc tách Furigana chính xác.');
  } else {
    console.error('❌ Test 2 FAILED');
  }

  // Test 3: Tính độ khớp phần trăm Dictation
  const targetHira = 'なにかおさがしですか';
  const userTypedHira = 'なにかおさがしですか';
  const score100 = calculateHiraganaSimilarity(userTypedHira, targetHira);
  console.log(`[Test 3.1] Gõ đúng 100%: Điểm = ${score100}%`);

  const userTypedMinorError = 'なにかおさがしでずか'; // sai 1 ký tự
  const scoreNear90 = calculateHiraganaSimilarity(userTypedMinorError, targetHira);
  console.log(`[Test 3.2] Sai 1 âm (đạt >80%): Điểm = ${scoreNear90}%`);

  if (score100 === 100 && scoreNear90 >= 80) {
    console.log('✅ Test 3 PASSED: Thuật toán độ tương đồng Hiragana Levenshtein hoạt động chính xác!');
  } else {
    console.error('❌ Test 3 FAILED');
  }

  console.log('--- HOÀN THÀNH TẤT CẢ KIỂM THỬ KUROMOJI ---');
}

runTests().catch(console.error);
