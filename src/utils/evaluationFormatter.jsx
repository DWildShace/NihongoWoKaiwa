import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakJapanese } from './soundEffects';

/**
 * Component hiển thị đoạn văn bản có trích dẫn tiếng Nhật trong ngoặc 「...」
 * Tự động tạo chip từ vựng/mẫu câu có nút bấm phát âm trực tiếp bằng giọng Tokyo Studio
 */
export function HighlightedJapaneseText({ text = '', theme = 'amber' }) {
  const [playingPhrase, setPlayingPhrase] = useState(null);

  if (!text || typeof text !== 'string') return null;

  // Tách văn bản theo các cụm trong ngoặc 「...」
  const parts = [];
  const regex = /「([^」]+)」/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'japanese', content: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  const themeStyles = {
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-200 hover:bg-amber-500/25',
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25',
    indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/25',
    rose: 'bg-rose-500/15 border-rose-500/30 text-rose-200 hover:bg-rose-500/25',
    sky: 'bg-sky-500/15 border-sky-500/30 text-sky-200 hover:bg-sky-500/25',
  };

  const activeThemeClass = themeStyles[theme] || themeStyles.amber;

  const handleSpeak = (phrase, e) => {
    e.stopPropagation();
    setPlayingPhrase(phrase);
    speakJapanese(phrase, 1.0, () => setPlayingPhrase(null));
  };

  return (
    <span>
      {parts.map((p, idx) => {
        if (p.type === 'text') {
          return <span key={idx}>{p.content}</span>;
        }

        const isPlaying = playingPhrase === p.content;

        return (
          <span
            key={idx}
            onClick={(e) => handleSpeak(p.content, e)}
            title="Bấm để nghe phát âm chuẩn"
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md border font-jp font-semibold text-xs sm:text-[13px] transition-all cursor-pointer select-none ${activeThemeClass} ${
              isPlaying ? 'ring-2 ring-amber-400 scale-[1.02]' : ''
            }`}
          >
            <span>「{p.content}」</span>
            <Volume2 className={`w-3 h-3 shrink-0 opacity-75 hover:opacity-100 ${isPlaying ? 'animate-bounce text-amber-300' : ''}`} />
          </span>
        );
      })}
    </span>
  );
}

/**
 * Bóc tách chuỗi nhận xét cải thiện (grammarImprovements) thành danh sách các Card luận điểm
 * Tương thích 100% với cả dữ liệu text cũ lẫn mảng cấu trúc JSON mới
 */
export function parseImprovementPoints(rawText, structuredArray) {
  // 1. Nếu có sẵn mảng cấu trúc từ AI backend
  if (Array.isArray(structuredArray) && structuredArray.length > 0) {
    return structuredArray.map((item, idx) => {
      const turnNum = item.turn || item.turnIndex || null;
      const suggestions = Array.isArray(item.corrections)
        ? item.corrections
        : item.suggestion
        ? [item.suggestion]
        : item.corrected
        ? [item.corrected]
        : [];

      return {
        id: 'struct_' + idx,
        tag: turnNum ? `Lượt ${turnNum}` : `Điểm ${idx + 1}`,
        turnNumber: turnNum,
        original: item.userSaid || item.original || null,
        suggestions,
        explanation: item.explanation || item.reason || '',
        fullText: '',
      };
    });
  }

  // 2. Bóc tách từ văn bản text thuần
  if (!rawText || typeof rawText !== 'string') return [];
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Tìm các mốc phân đoạn (Lỗi rõ nhất là ở lượt X:, Lượt X:, Ở lượt X:, Ngoài ra,, Cuối cùng,, v.v.)
  const markerRegex = /(?:^|\. |\n|;\s*)(?:[-•*]\s*|\d+[\.)]\s*)?(Lỗi[^.:\n]*?lượt\s*\d+|Lượt\s*\d+|Ở lượt\s*\d+|Ngoài ra|Cuối cùng|Lưu ý|Điểm\s*\d+)[：:\-–—,\s]/gi;
  const indices = [];
  let m;

  while ((m = markerRegex.exec(trimmed)) !== null) {
    let offset = 0;
    if (m[0].startsWith('. ') || m[0].startsWith('; ')) offset = 2;
    else if (m[0].startsWith('\n')) offset = 1;
    indices.push({ index: m.index + offset, rawTag: m[1].trim() });
  }

  let rawChunks = [];
  if (indices.length <= 1) {
    // Thử tách theo dòng nếu có nhiều dòng
    const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      rawChunks = lines.map((l, i) => ({
        rawTag: `Mục ${i + 1}`,
        text: l.replace(/^[-•*]\s*|\d+[\.)]\s*/, ''),
      }));
    } else {
      rawChunks = [{ rawTag: indices[0]?.rawTag || 'Trọng tâm cải thiện', text: trimmed }];
    }
  } else {
    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].index;
      const end = i + 1 < indices.length ? indices[i + 1].index : trimmed.length;
      rawChunks.push({
        rawTag: indices[i].rawTag,
        text: trimmed.slice(start, end).trim(),
      });
    }
  }

  return rawChunks.map((chunk, idx) => {
    // Trích xuất các cụm trong ngoặc 「...」
    const quotes = [];
    const qRegex = /「([^」]+)」/g;
    let qm;
    while ((qm = qRegex.exec(chunk.text)) !== null) {
      const q = qm[1].trim();
      if (!quotes.includes(q)) quotes.push(q);
    }

    let tag = chunk.rawTag;
    const turnMatch = tag.match(/lượt\s*(\d+)/i) || chunk.text.match(/lượt\s*(\d+)/i);
    const turnNumber = turnMatch ? turnMatch[1] : null;

    let original = null;
    let suggestions = [];

    if (quotes.length >= 2) {
      // Câu đầu tiên thường là câu học viên nói lỗi
      original = quotes[0];
      suggestions = quotes.slice(1);
    } else if (quotes.length === 1) {
      if (/không phải|chưa chuẩn|sai|nhầm|xen vào|tránh|không liên quan/i.test(chunk.text)) {
        original = quotes[0];
      } else {
        suggestions = [quotes[0]];
      }
    }

    return {
      id: 'point_' + idx,
      tag: turnNumber ? `Lượt ${turnNumber}` : tag,
      turnNumber,
      original,
      suggestions,
      explanation: chunk.text,
      fullText: chunk.text,
      quotes,
    };
  });
}
