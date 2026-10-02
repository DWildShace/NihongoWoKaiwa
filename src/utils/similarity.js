// src/utils/similarity.js
import * as wanakana from 'wanakana';

/**
 * Chuẩn hóa chuỗi tiếng Nhật về Hiragana trơn để so sánh
 */
export function cleanToHiragana(text = '') {
  if (!text) return '';
  // 1. Chuyển Katakana/Romaji về Hiragana
  let hira = wanakana.toHiragana(text);

  // 2. Chuẩn hóa trường âm ー (Chōonpu) theo nguyên âm đứng trước để tương thích hoàn toàn
  // giữa cách gõ Hiragana có dấu gạch ngang (けーき) và phiên âm Kuromoji (けえき, ちいず, ろうる)
  hira = hira
    .replace(/([あかさたなはまやらわがざだばぱぁゃ])ー/g, '$1あ')
    .replace(/([いきしちにひみりぎじぢびぴぃ])ー/g, '$1い')
    .replace(/([うくすつぬふむゆるぐずづぶぷぅゅ])ー/g, '$1う')
    .replace(/([えけせてねへめれげぜでべぺぇ])ー/g, '$1え')
    .replace(/([おこそとのほもよろをごぞどぼぽぉょ])ー/g, '$1う')
    .replace(/ー/g, '');

  // 3. Loại bỏ khoảng trắng và mọi dấu câu tiếng Nhật + Latin
  let clean = hira.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\u3000\-_/]/g, '').toLowerCase();

  // 4. Nếu có ký tự phụ âm Latinh đơn lẻ nằm kẹt (như chữ 'g' gõ dang dở trong 'けーきgございます'),
  // loại bỏ để không phạt điểm oan người học
  clean = clean.replace(/[b-df-hj-np-tv-z]/g, '');

  return clean;
}

/**
 * Thuật toán tính khoảng cách Levenshtein
 */
export function getLevenshteinDistance(a = '', b = '') {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Tính điểm khớp thời gian thực (0% - 100%) giữa chuỗi người dùng gõ và chuỗi đích
 * @param {string} userInput - Văn bản người dùng gõ (Romaji/Hiragana/Kanji)
 * @param {string} targetHiragana - Chuỗi Hiragana đích chuẩn đã được server bóc tách
 */
export function computeRealtimeMatch(userInput = '', targetHiragana = '') {
  const cleanInput = cleanToHiragana(userInput);
  const cleanTarget = cleanToHiragana(targetHiragana);

  if (!cleanInput && !cleanTarget) return 100;
  if (!cleanInput || !cleanTarget) return 0;
  if (cleanInput === cleanTarget) return 100;

  const maxLen = Math.max(cleanInput.length, cleanTarget.length);
  const dist = getLevenshteinDistance(cleanInput, cleanTarget);
  const score = Math.max(0, (1 - dist / maxLen) * 100);

  return Math.round(score * 10) / 10;
}
