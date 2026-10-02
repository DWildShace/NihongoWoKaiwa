// server/services/deepseekService.js
import { annotateSentence, normalizeToHiragana } from './kuromojiService.js';
import { synthesizeJapaneseAudio } from './ttsService.js';
import dotenv from 'dotenv';
dotenv.config();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * Kiểm tra xem DeepSeek API Key đã được cấu hình hay chưa
 */
export function isDeepSeekConfigured() {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim() && key !== 'your_deepseek_api_key_here');
}

/**
 * Gọi DeepSeek API chuẩn OpenAI format
 */
export async function callDeepSeek(messages, options = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('Chưa cấu hình DEEPSEEK_API_KEY trong file .env');
  }

  const {
    temperature = 0.7,
    maxTokens = 400,
    responseFormat = { type: 'json_object' },
  } = options;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`DeepSeek API lỗi (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return { content, usage: data.usage };
}

/**
 * [DEEPSEEK FAST-TURN] Lượt đối đáp phản xạ nhanh bằng DeepSeek-V3
 */
export async function generateDeepSeekFastNextTurn({
  spokenText = '',
  turnIndex = 1,
  totalTurns = 10,
  history = [],
  scenario = {},
}) {
  const actualUserText = (spokenText || '').trim() || 'はい';
  const isFinal = turnIndex >= totalTurns;

  const conversationContext = history
    .map((h) => `${h.speaker === 'ai' ? scenario.aiRole || 'AI' : scenario.userRole || 'Học viên'}: ${h.text}`)
    .join('\n');

  const systemPrompt = `Bạn là đối tác giao tiếp tiếng Nhật bản xứ, đang nhập vai "${scenario.aiRole || 'Đối tác'}" để trò chuyện trực tiếp với "${scenario.userRole || 'Khách/Học viên'}".
Bối cảnh tình huống: "${scenario.title || 'Hội thoại hàng ngày'}" - ${scenario.description || ''}.
Lượt trò chuyện hiện tại: ${turnIndex}/${totalTurns}.

NHIỆM VỤ:
1. Đáp lại 1-2 câu tiếng Nhật tự nhiên, ngắn gọn, chuẩn vai "${scenario.aiRole || 'AI'}", duy trì mạch hội thoại phù hợp với câu người học vừa nói. ${isFinal ? '(Đây là lượt cuối, hãy nói lời chào kết thúc hoặc cảm ơn phù hợp).' : ''}
2. Đưa ra ĐÚNG 1 câu gợi ý trả lời tự nhiên nhất cho người học ở lượt kế tiếp (kèm dịch tiếng Việt).

Định dạng JSON bắt buộc:
{
  "aiSentence": "Câu thoại tiếp theo bằng tiếng Nhật",
  "vietnamese": "Dịch nghĩa tiếng Việt của câu AI",
  "replyIdea": {
    "jp": "1 câu gợi ý trả lời tiếng Nhật tự nhiên nhất",
    "vi": "Dịch nghĩa tiếng Việt câu gợi ý"
  }
}`;

  const userPrompt = `Lịch sử cuộc hội thoại:
${conversationContext || 'Bắt đầu cuộc trò chuyện.'}

Người học vừa nói: "${actualUserText}"`;

  const { content } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { maxTokens: 300, temperature: 0.7 }
  );

  const parsed = JSON.parse(content);
  const aiText = parsed.aiSentence || 'かしこまりました。';

  // [PRE-WARMING TTS]: Kích hoạt tổng hợp âm thanh ngay lập tức vào RAM cache ngầm
  synthesizeJapaneseAudio(aiText, { voice: 'nanami', rate: 1.0 }).catch(() => {});

  const annotated = await annotateSentence(aiText);
  const normalizedHira = await normalizeToHiragana(aiText);

  return {
    nextTurn: {
      aiSentence: aiText,
      reading: annotated.reading,
      furiganaTokens: annotated.furiganaTokens,
      normalizedHiragana: normalizedHira,
      vietnamese: parsed.vietnamese || '',
      replyIdeas: parsed.replyIdea ? [parsed.replyIdea] : [{ jp: 'ありがとうございます。', vi: 'Cảm ơn bạn.' }],
    },
    turnIndex,
    isFinalTurn: isFinal,
    provider: 'deepseek',
  };
}

/**
 * [DEEPSEEK REVIEW] Đánh giá tổng quan toàn diện sau 10 lượt bằng DeepSeek-V3
 */
export async function generateDeepSeekSessionReview({ scenario = {}, sessionHistory = [] }) {
  const conversationLog = sessionHistory
    .map((t, idx) => `${idx + 1}. [${t.speaker === 'ai' ? scenario.aiRole || 'AI' : scenario.userRole || 'Học viên'}]: ${t.text}`)
    .join('\n');

  const systemPrompt = `Bạn là Giảng viên Trưởng chuyên ngành Ngữ âm & Ngữ dụng học tiếng Nhật bản xứ.
Người học vừa hoàn thành phiên luyện phản xạ giao tiếp thực chiến:
Bối cảnh: "${scenario.title || 'Hội thoại hàng ngày'}" - ${scenario.description || ''}
Vai trò: AI đóng vai "${scenario.aiRole || 'Đối tác'}", Người học đóng vai "${scenario.userRole || 'Học viên'}".

Toàn bộ biên bản cuộc hội thoại:
${conversationLog}

NHIỆM VỤ: Hãy tổng duyệt toàn diện buổi luyện nói của người học:
1. Chấm điểm tổng quan toàn buổi (overallScore từ 0 đến 100).
2. Đánh giá độ trôi chảy & phản xạ (fluencyFeedback): nhận xét bằng tiếng Việt thân thiện, khích lệ.
3. Phân tích ngữ pháp & từ vựng (grammarStrengths): chỉ ra các điểm người học đã dùng đúng và hay.
4. Các điểm cần cải thiện (grammarImprovements): chỉ ra lỗi ngữ pháp/dùng từ (nếu có) và hướng sửa.
5. Sắc thái tự nhiên của người Nhật (naturalNuances): người bản xứ trong thực tế sẽ nói thế nào cho mượt mà hơn.
6. 3-4 từ vựng hoặc cấu trúc xuất sắc nhất nên lưu vào Flashcard (recommendedVocabulary: [{ word, reading, meaning }]).

Định dạng JSON bắt buộc:
{
  "overallScore": 90,
  "fluencyFeedback": "Nhận xét độ trôi chảy...",
  "grammarStrengths": "Điểm mạnh...",
  "grammarImprovements": "Điểm cần cải thiện...",
  "naturalNuances": "Gợi ý tự nhiên của người bản xứ...",
  "recommendedVocabulary": [
    { "word": "Từ vựng", "reading": "Cách đọc", "meaning": "Nghĩa tiếng Việt" }
  ]
}`;

  const { content } = await callDeepSeek(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Hãy phân tích chi tiết phiên hội thoại trên.' }],
    { maxTokens: 800, temperature: 0.6 }
  );

  const parsed = JSON.parse(content);
  return {
    overallScore: parsed.overallScore || 90,
    fluencyFeedback: parsed.fluencyFeedback || 'Bạn đã hoàn thành rất tốt buổi hội thoại phản xạ!',
    grammarStrengths: parsed.grammarStrengths || 'Diễn đạt tự nhiên, nắm vững cấu trúc hội thoại cơ bản.',
    grammarImprovements: parsed.grammarImprovements || 'Chú ý phát âm rõ các âm ngắt và trường âm khi giao tiếp.',
    naturalNuances: parsed.naturalNuances || 'Có thể kết hợp thêm các từ đệm như あのう、ええと để cuộc nói chuyện tự nhiên hơn.',
    recommendedVocabulary: parsed.recommendedVocabulary || [],
    provider: 'deepseek',
  };
}

/**
 * [DEEPSEEK SCENARIO] Khởi tạo ngữ cảnh ngẫu nhiên bằng DeepSeek-V3
 */
export async function generateDeepSeekRandomScenario({ level = 'all', topic = 'all' } = {}) {
  const prompt = `Bạn là chuyên gia sư phạm tiếng Nhật bản xứ và nhà thiết kế hội thoại thực chiến.
Hãy tạo MỘT tình huống giao tiếp đời sống ngẫu nhiên:
- Cấp độ yêu cầu: ${level}
- Chủ đề: ${topic}

Định dạng JSON bắt buộc:
{
  "title": "Tên tình huống tiếng Nhật kèm dịch (vd: コンビニでのお会計 (Thanh toán tại Konbini))",
  "level": "${level !== 'all' ? level : 'N4'}",
  "topic": "${topic !== 'all' ? topic : 'daily'}",
  "aiRole": "Vai của AI (vd: 店員 (Nhân viên thu ngân))",
  "userRole": "Vai người học (vd: 客 (Khách mua hàng))",
  "description": "Mô tả bối cảnh ngắn gọn bằng tiếng Việt (1-2 câu)",
  "firstTurn": {
    "aiSentence": "Câu mở đầu tiếng Nhật tự nhiên ngắn gọn",
    "vietnamese": "Dịch nghĩa tiếng Việt",
    "replyIdeas": [
      { "jp": "Câu gợi ý trả lời duy nhất", "vi": "Dịch tiếng Việt" }
    ]
  }
}`;

  const { content } = await callDeepSeek(
    [{ role: 'user', content: prompt }],
    { maxTokens: 500, temperature: 0.8 }
  );

  const data = JSON.parse(content);
  const aiText = data.firstTurn?.aiSentence || 'いらっしゃいませ。';
  const annotated = await annotateSentence(aiText);
  const normalizedHira = await normalizeToHiragana(aiText);

  return {
    scenarioId: 'deepseek_' + Date.now(),
    scenario: {
      title: data.title,
      level: data.level || (level !== 'all' ? level : 'N4'),
      topic: data.topic || (topic !== 'all' ? topic : 'daily'),
      aiRole: data.aiRole,
      userRole: data.userRole,
      description: data.description,
    },
    firstTurn: {
      aiSentence: aiText,
      reading: annotated.reading,
      furiganaTokens: annotated.furiganaTokens,
      normalizedHiragana: normalizedHira,
      vietnamese: data.firstTurn?.vietnamese || '',
      replyIdeas: data.firstTurn?.replyIdeas?.slice(0, 1) || [
        { jp: 'はい、お願いします。', vi: 'Vâng, làm phiền bạn ạ.' },
      ],
    },
    isMock: false,
    modelUsed: 'deepseek-chat',
  };
}
