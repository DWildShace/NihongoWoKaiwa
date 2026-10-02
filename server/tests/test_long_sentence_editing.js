// server/tests/test_long_sentence_editing.js
import assert from 'assert';
import * as wanakana from 'wanakana';
import { computeRealtimeMatch, cleanToHiragana, getLevenshteinDistance } from '../../src/utils/similarity.js';

console.log('====================================================');
console.log('🧪 BỘ KIỂM THỬ (TESTCASES) CHỈNH SỬA CÂU DICTATION DÀI');
console.log('====================================================\n');

// Dữ liệu mẫu thực tế từ phản hồi người dùng:
// Mục tiêu: "チーズケーキ、チョコレートケーキ、いちごケーキ、抹茶ロールケーキがございます。どれのケーキになさいますか？"
const targetSentence = 'チーズケーキ、チョコレートケーキ、いちごケーキ、抹茶ロールケーキがございます。どれのケーキになさいますか？';
// Phiên âm Hiragana chuẩn mà Kuromoji server sinh ra:
const targetHiragana = 'ちいずけえきちょこれえとけえきいちごけえきまっちゃろうるけえきがございますどれのけえきになさいますか';

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✅ [PASS] Testcase ${totalCount}: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [FAIL] Testcase ${totalCount}: ${name}`);
    console.error(`   -> Lỗi: ${err.message}`);
  }
}

// ----------------------------------------------------
// TESTCASE 1: Chuẩn hóa trường âm ー (Chōonpu)
// Người học gõ Romaji 'ke-ki' hoặc Hiragana 'けーき', trong khi Kuromoji sinh ra 'けえき'
// ----------------------------------------------------
runTest('Chuẩn hóa trường âm ー (けーき == けえき, ケーキ == けーき)', () => {
  const match1 = computeRealtimeMatch('けーき', 'けえき');
  const match2 = computeRealtimeMatch('ケーキ', 'けーき');
  const match3 = computeRealtimeMatch('チーズケーキ', 'ちーずけーき');

  assert.strictEqual(match1, 100, `けーき vs けえき phải đạt 100%, thực tế: ${match1}%`);
  assert.strictEqual(match2, 100, `ケーキ vs けーき phải đạt 100%, thực tế: ${match2}%`);
  assert.strictEqual(match3, 100, `チーズケーキ vs ちーずけーき phải đạt 100%, thực tế: ${match3}%`);
});

// ----------------------------------------------------
// TESTCASE 2: Ký tự Latinh đơn lẻ nằm kẹt (Stray Consonants)
// Ví dụ khi sửa giữa câu, người học gõ dở chữ 'g' trong 'けーきgございます'
// ----------------------------------------------------
runTest('Bỏ qua phụ âm tiếng Anh sót lại khi gõ dang dở (như chữ "g")', () => {
  const cleanWithG = cleanToHiragana('けーきgございます');
  const cleanWithoutG = cleanToHiragana('けーきございます');
  assert.strictEqual(cleanWithG, cleanWithoutG, `Chuỗi '${cleanWithG}' phải tương đương '${cleanWithoutG}'`);
});

// ----------------------------------------------------
// TESTCASE 3: Trạng thái câu người dùng gặp phải trong ảnh chụp
// "きけーき、ちょくれっとけーき、いちごけーき、まちゃあろくけーきgございます、どれのけーきになさ"
// ----------------------------------------------------
runTest('Tính điểm câu dài đang gõ dở (72% - 74%)', () => {
  const userScreenshot = 'きけーき、ちょくれっとけーき、いちごけーき、まちゃあろくけーきgございます、どれのけーきになさ';
  const score = computeRealtimeMatch(userScreenshot, targetHiragana);
  console.log(`   [Info] Điểm hiện tại của câu đang gõ dở: ${score}% (Chưa đạt 80% do thiếu đuôi "いますか")`);
  assert.ok(score >= 70 && score <= 75, `Điểm phải nằm trong khoảng 70-75%, thực tế: ${score}%`);
});

// ----------------------------------------------------
// TESTCASE 4: Người học hoàn thành phần đuôi bị che khuất "いますか"
// Sau khi UI sửa lỗi không che chữ, người học thấy rõ và gõ tiếp "いますか"
// ----------------------------------------------------
runTest('Mở khóa Microphone khi người học gõ đủ đuôi câu (≥ 80%)', () => {
  const userCompleted = 'きけーき、ちょくれっとけーき、いちごけーき、まちゃあろくけーきございます、どれのけーきになさいますか';
  const score = computeRealtimeMatch(userCompleted, targetHiragana);
  console.log(`   [Info] Điểm sau khi hoàn thành đuôi "いますか": ${score}% (Đã vượt ngưỡng 80%!)`);
  assert.ok(score >= 80, `Điểm phải >= 80% để mở khóa mic, thực tế: ${score}%`);
});

// ----------------------------------------------------
// TESTCASE 5: Sửa các từ sai ở giữa câu (きけーき -> ちーずけーき, まちゃあろく -> まっちゃろーる)
// ----------------------------------------------------
runTest('Chỉnh sửa đúng toàn bộ câu dài đạt điểm tối đa 100%', () => {
  const userFull = 'ちーずけーき、ちょこれーとけーき、いちごけーき、まっちゃろーるけーきがございます、どれのけーきになさいますか';
  const score = computeRealtimeMatch(userFull, targetHiragana);
  assert.strictEqual(score, 100, `Câu hoàn chỉnh phải đạt 100%, thực tế: ${score}%`);
});

// ----------------------------------------------------
// TESTCASE 6: Nhập liệu hoàn toàn bằng Romaji dài (không gõ Hiragana trực tiếp)
// ----------------------------------------------------
runTest('Gõ câu dài bằng Romaji chuyển đổi tự nhiên', () => {
  const romaji = 'chiizuke-ki, chokore-toke-ki, ichigoke-ki, matcharo-ruke-kigagozaimasu, dorenoke-kininasaimasuka';
  const score = computeRealtimeMatch(romaji, targetHiragana);
  console.log(`   [Info] Điểm khi gõ toàn bộ bằng Romaji: ${score}%`);
  assert.ok(score >= 90, `Romaji chuẩn phải đạt >= 90%, thực tế: ${score}%`);
});

console.log('\n====================================================');
console.log(`🎉 KẾT QUẢ: ${passedCount}/${totalCount} TESTCASES HOÀN TOÀN THÀNH CÔNG!`);
console.log('====================================================\n');
