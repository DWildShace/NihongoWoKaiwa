// server/services/kuromojiService.js
import kuromoji from 'kuromoji';
import * as wanakana from 'wanakana';
import path from 'path';

let tokenizerInstance = null;
let tokenizerPromise = null;

/**
 * Khởi tạo singleton tokenizer của Kuromoji
 */
export function getTokenizer() {
  if (tokenizerInstance) {
    return Promise.resolve(tokenizerInstance);
  }
  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    const dictPath = path.resolve('node_modules/kuromoji/dict');
    kuromoji.builder({ dicPath: dictPath }).build((err, tokenizer) => {
      if (err) {
        console.error('[TOKENIZER ERROR] Không thể khởi tạo Kuromoji:', err.message);
        tokenizerPromise = null;
        return reject(err);
      }
      tokenizerInstance = tokenizer;
      console.log('✅ [TOKENIZER] Kuromoji đã sẵn sàng phân tích ngữ pháp & âm đọc!');
      resolve(tokenizer);
    });
  });

  return tokenizerPromise;
}

/**
 * Chuẩn hóa bất kỳ chuỗi tiếng Nhật (Kanji/Kana/Katakana) về dạng Hiragana trơn
 * Loại bỏ toàn bộ khoảng trắng, dấu câu tiếng Nhật và La-tinh
 */
export async function normalizeToHiragana(text = '') {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  if (!clean) return '';

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(clean);
    const rawKana = tokens.map((t) => t.reading || t.surface_form).join('');
    const hira = wanakana.toHiragana(rawKana);
    // Loại bỏ dấu câu và ký tự đặc biệt
    return hira.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\u3000\-_/]/g, '');
  } catch (err) {
    console.warn('[TOKENIZER] normalizeToHiragana fallback wanakana:', err.message);
    const directHira = wanakana.toHiragana(clean);
    return directHira.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\u3000\-_/]/g, '');
  }
}

/**
 * Phân tích câu tiếng Nhật và sinh mảng Furigana phục vụ giao diện hiển thị
 * @returns {Promise<{ rawText: string, reading: string, furiganaTokens: Array<{ text: string, furigana?: string }>, furiganaString: string }>}
 */
export async function annotateSentence(text = '') {
  if (!text || !text.trim()) {
    return { rawText: '', reading: '', furiganaTokens: [], furiganaString: '' };
  }

  const cleanText = text.trim();
  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(cleanText);

    // 1. Âm đọc chuẩn Hiragana
    const reading = wanakana.toHiragana(tokens.map((t) => t.reading || t.surface_form).join(''));

    // 2. Mảng tokens cho Furigana Ruby tag (có bóc tách Okurigana đuôi)
    const furiganaTokens = [];
    tokens.forEach((t) => {
      const surface = t.surface_form;
      const tReading = t.reading ? wanakana.toHiragana(t.reading) : '';
      const hasKanji = /[\u4e00-\u9faf]/.test(surface);

      if (hasKanji && tReading && tReading !== surface) {
        // Tách phần Okurigana ở cuối nếu có (ví dụ: surface="温め", reading="あたため" -> kanji="温", furigana="あたた", okuri="め")
        let sEnd = surface.length - 1;
        let rEnd = tReading.length - 1;
        while (sEnd >= 0 && rEnd >= 0 && surface[sEnd] === tReading[rEnd] && !/[\u4e00-\u9faf]/.test(surface[sEnd])) {
          sEnd--;
          rEnd--;
        }
        const kanjiPart = surface.slice(0, sEnd + 1);
        const furiPart = tReading.slice(0, rEnd + 1);
        const okuriPart = surface.slice(sEnd + 1);

        furiganaTokens.push({ text: kanjiPart, furigana: furiPart });
        if (okuriPart) {
          furiganaTokens.push({ text: okuriPart });
        }
      } else {
        furiganaTokens.push({ text: surface });
      }
    });

    const furiganaString = furiganaTokens
      .map((t) => (t.furigana ? `${t.furigana} ${t.text}` : t.text))
      .join(' ');

    return {
      rawText: cleanText,
      reading,
      furiganaTokens,
      furiganaString,
    };
  } catch (err) {
    console.warn('[TOKENIZER] annotateSentence fallback:', err.message);
    return {
      rawText: cleanText,
      reading: wanakana.toHiragana(cleanText),
      furiganaTokens: [{ text: cleanText }],
      furiganaString: cleanText,
    };
  }
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi
 */
export function levenshteinDistance(a = '', b = '') {
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
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Tính độ khớp phần trăm (0 - 100%) giữa 2 chuỗi Hiragana
 */
export function calculateHiraganaSimilarity(inputHira = '', targetHira = '') {
  if (!inputHira && !targetHira) return 100;
  if (!inputHira || !targetHira) return 0;
  if (inputHira === targetHira) return 100;

  const maxLen = Math.max(inputHira.length, targetHira.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(inputHira, targetHira);
  const similarity = Math.max(0, (1 - distance / maxLen) * 100);
  return Math.round(similarity * 10) / 10;
}
