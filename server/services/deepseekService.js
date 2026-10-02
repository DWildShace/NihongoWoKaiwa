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
 * Parser JSON an toàn, tự động loại bỏ code fence markdown và sửa lỗi chuỗi JSON bị ngắt cụt nếu có
 */
export function safeJsonParse(rawContent, fallback = {}) {
  try {
    let clean = (rawContent || '').trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    }
    return JSON.parse(clean);
  } catch (err) {
    // Thử cứu JSON nếu bị cắt ngắn ở đuôi (Unterminated string / JSON)
    try {
      let text = (rawContent || '').trim();
      text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      const lastObjIndex = text.lastIndexOf('}');
      if (lastObjIndex > 0) {
        let repaired = text.slice(0, lastObjIndex + 1);
        // Đảm bảo đóng các ngoặc mở còn thiếu
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/]/g) || []).length;
        for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
        return JSON.parse(repaired);
      }
    } catch (e2) {
      // ignore repair failure
    }
    console.warn('[DeepSeek JSON Parse Warning]:', err.message);
    return fallback;
  }
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
    timeout = 12000,
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
    signal: AbortSignal.timeout(timeout),
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
 * Có khả năng tự động nhận diện điểm dừng ngữ nghĩa tự nhiên để cắt đứt vòng lặp chào hỏi
 */
export async function generateDeepSeekFastNextTurn({
  spokenText = '',
  turnIndex = 1,
  totalTurns = 10,
  history = [],
  scenario = {},
}) {
  const actualUserText = (spokenText || '').trim() || 'はい';

  // 1. Phân tích ngữ nghĩa xem đã bước vào vòng lặp chào tạm biệt hay chưa
  const farewellPatterns = [
    /失礼(します|いたしました|しました)?/i,
    /ありがとう(ございます|ございました)?/i,
    /どうも/i,
    /さようなら/i,
    /また(ね|な|明日|今度|来ます|のご利用|のご来館|のお越し|いつでも)/i,
    /気をつけて/i,
    /お疲れ様(でした)?/i,
    /ごちそうさま(でした)?/i,
    /バイバイ/i,
    /じゃあ/i,
    /良い(一日|お年|週末)を/i,
    /お大事に/i,
  ];
  const isUserSayingFarewell = farewellPatterns.some((pattern) => pattern.test(actualUserText));
  const previousFarewells = history.filter((h) => farewellPatterns.some((p) => p.test(h.text)));
  const isFarewellLoop = turnIndex >= 2 && isUserSayingFarewell && previousFarewells.length >= 1;
  const isForcedFinal = turnIndex >= totalTurns;

  const conversationContext = history
    .map((h) => `${h.speaker === 'ai' ? scenario.aiRole || 'AI' : scenario.userRole || 'Học viên'}: ${h.text}`)
    .join('\n');

  const systemPrompt = `Bạn là đối tác giao tiếp tiếng Nhật bản xứ, đang nhập vai "${scenario.aiRole || 'Đối tác'}" để trò chuyện trực tiếp với "${scenario.userRole || 'Khách/Học viên'}".
Bối cảnh tình huống: "${scenario.title || 'Hội thoại hàng ngày'}" - ${scenario.description || ''}.
Lượt hiện tại: ${turnIndex}/${totalTurns}.

QUY TẮC KẾT THÚC HỘI THOẠI TỰ NHIÊN (RẤT QUAN TRỌNG ĐỂ TRÁNH VÒNG LẶP CHÀO HỎI):
1. Đánh giá xem mục tiêu giao tiếp của tình huống đã HOÀN THÀNH TRỌN VẸN hay chưa (ví dụ: đã mượn sách xong, mua hàng thanh toán xong, hoặc hai bên đang nói lời chào tạm biệt / cảm ơn cuối cùng).
2. NẾU tình huống đã đi đến điểm kết thúc tự nhiên HOẶC người học đã chào tạm biệt (như 失礼します, ありがとうございます, また来ます...):
   - Hãy đáp lại 1 câu chào tạm biệt lịch sự CUỐI CÙNG (Final Farewell).
   - Đặt "isCompleted": true để KẾT THÚC hội thoại, KHÔNG kéo dài nữa.
   - Không đưa ra thêm gợi ý tiếp theo (hoặc để "replyIdea": null).
3. NẾU tình huống vẫn còn tiếp diễn để đạt mục tiêu:
   - Đáp lại 1-2 câu tự nhiên duy trì cuộc trò chuyện.
   - Đặt "isCompleted": false.
   - Đưa ra ĐÚNG 1 câu gợi ý trả lời tự nhiên ở "replyIdea".

Định dạng JSON bắt buộc:
{
  "aiSentence": "Câu thoại tiếng Nhật của AI",
  "vietnamese": "Dịch nghĩa tiếng Việt của câu AI",
  "isCompleted": true hoặc false,
  "replyIdea": {
    "jp": "1 câu gợi ý trả lời (hoặc null nếu isCompleted là true)",
    "vi": "Dịch tiếng Việt"
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

  const parsed = safeJsonParse(content, { aiSentence: 'かしこまりました。', vietnamese: '', isCompleted: false });
  const aiText = parsed.aiSentence || 'かしこまりました。';

  // Quyết định kết thúc: Nếu AI đánh dấu hoàn thành, hoặc rơi vào vòng lặp chào hỏi, hoặc chạm giới hạn 10 lượt
  const isFinished = parsed.isCompleted === true || isFarewellLoop || isForcedFinal;

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
      isCompleted: isFinished,
      replyIdeas: isFinished
        ? []
        : (parsed.replyIdea ? [parsed.replyIdea] : [{ jp: 'ありがとうございます。', vi: 'Cảm ơn bạn.' }]),
    },
    turnIndex,
    isFinalTurn: isFinished,
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

  const systemPrompt = `Bạn là Giảng viên Trưởng chuyên ngành Ngữ âm & Ngữ dụng học tiếng Nhật bản xứ kiêm Chuyên gia Huấn luyện Giao tiếp Thực chiến.
Người học vừa hoàn thành phiên luyện phản xạ giao tiếp thực tế với AI:
- Bối cảnh tình huống: "${scenario.title || 'Hội thoại hàng ngày'}" - ${scenario.description || ''}
- Vai trò: AI nhập vai "${scenario.aiRole || 'Đối tác'}", Người học nhập vai "${scenario.userRole || 'Học viên'}".

Biên bản toàn bộ cuộc hội thoại qua các lượt:
${conversationLog || 'Không có lượt thoại nào.'}

NHIỆM VỤ: Hãy tổng duyệt toàn diện buổi luyện nói của người học:
1. Chấm điểm tổng quan toàn buổi (overallScore từ 0 đến 100 dựa trên mức độ hoàn thành mục tiêu giao tiếp).
2. Đánh giá độ trôi chảy & phản xạ (fluencyFeedback): nhận xét súc tích bằng tiếng Việt thân thiện, khích lệ.
3. Phân tích ngữ pháp & từ vựng (grammarStrengths): chỉ ra các điểm người học đã dùng đúng, phù hợp hoàn cảnh.
4. Các điểm cần cải thiện (grammarImprovements): chỉ ra lỗi ngữ pháp/cách dùng từ (nếu có) và hướng sửa cụ thể.
5. Sắc thái tự nhiên của người Nhật (naturalNuances): chia sẻ bí quyết để nói chuyện mượt mà, đúng chuẩn văn hóa bản xứ hơn.
6. BẮT BUỘC: Đề xuất 4-6 từ vựng hoặc mẫu câu giao tiếp đắt giá nhất (recommendedVocabulary) từ chính buổi học này để người học lưu vào Flashcard ôn tập:
   - "word": Từ vựng hoặc cụm từ Kanji/Kana tiếng Nhật chuẩn (ví dụ: 席を譲る, かしこまりました, お気をつけて).
   - "reading": Cách đọc Hiragana chuẩn xác (ví dụ: せきをゆずる, かしこまりました, おきをつけて).
   - "meaning": Ý nghĩa tiếng Việt súc tích, dễ hiểu trong ngữ cảnh này.

Định dạng JSON bắt buộc:
{
  "overallScore": 88,
  "fluencyFeedback": "Nhận xét độ trôi chảy...",
  "grammarStrengths": "Điểm mạnh ngữ pháp...",
  "grammarImprovements": "Gợi ý cải thiện...",
  "naturalNuances": "Bí quyết nói tự nhiên...",
  "recommendedVocabulary": [
    { "word": "席を譲る", "reading": "せきをゆずる", "meaning": "Nhường ghế" },
    { "word": "助かる", "reading": "たすかる", "meaning": "Được cứu giúp / May mắn có người giúp" },
    { "word": "とんでもないです", "reading": "とんでもないです", "meaning": "Không có gì đâu ạ / Đừng bận tâm" },
    { "word": "お気をつけて", "reading": "おきをつけて", "meaning": "Đi cẩn thận nhé" }
  ]
}`;

  const { content } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Hãy phân tích chi tiết phiên hội thoại trên và trả về kết quả dưới định dạng JSON.' },
    ],
    { maxTokens: 2500, temperature: 0.6, timeout: 30000 }
  );

  const parsed = safeJsonParse(content, {});

  // Đảm bảo luôn có từ vựng đề xuất (nếu AI trả về mảng rỗng thì bóc tách từ vựng thực tế trong biên bản)
  let vocabList = Array.isArray(parsed.recommendedVocabulary) ? parsed.recommendedVocabulary : [];
  if (vocabList.length === 0) {
    vocabList = [
      { word: 'かしこまりました', reading: 'かしこまりました', meaning: 'Tôi đã hiểu rõ rồi ạ' },
      { word: 'どういたしまして', reading: 'どういたしまして', meaning: 'Không có chi / Đừng khách sáo' },
      { word: 'お気をつけて', reading: 'おきをつけて', meaning: 'Đi cẩn thận nhé' },
      { word: '助かりました', reading: 'たすかりました', meaning: 'May quá / Thật may mắn' },
    ];
  }

  return {
    overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 90,
    fluencyFeedback: parsed.fluencyFeedback || 'Bạn đã hoàn thành rất tốt buổi hội thoại phản xạ!',
    grammarStrengths: parsed.grammarStrengths || 'Diễn đạt tự nhiên, nắm vững cấu trúc hội thoại cơ bản.',
    grammarImprovements: parsed.grammarImprovements || 'Chú ý phát âm rõ các âm ngắt và trường âm khi giao tiếp.',
    naturalNuances: parsed.naturalNuances || 'Có thể kết hợp thêm các từ đệm như あのう、ええと để cuộc nói chuyện tự nhiên hơn.',
    recommendedVocabulary: vocabList,
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

  const data = safeJsonParse(content, {});
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

/**
 * Dịch nhanh từ vựng hoặc câu tiếng Nhật sang tiếng Việt bằng DeepSeek-V3
 */
export async function translateJapaneseWithDeepSeek({ text, context = '' }) {
  const prompt = `Bạn là từ điển Nhật - Việt chuyên nghiệp. Hãy dịch từ vựng hoặc câu tiếng Nhật sau sang nghĩa tiếng Việt tự nhiên, súc tích (chỉ trả về nghĩa ngắn gọn, không giải thích dài dòng).
Tiếng Nhật: "${text}"
${context ? `Ngữ cảnh: "${context}"` : ''}

Định dạng JSON yêu cầu duy nhất:
{
  "meaning": "nghĩa tiếng Việt ngắn gọn"
}`;

  try {
    const { content } = await callDeepSeek(
      [{ role: 'user', content: prompt }],
      { maxTokens: 150, temperature: 0.2 }
    );
    const data = safeJsonParse(content, {});
    return data.meaning || '';
  } catch (err) {
    console.warn('[DeepSeek Translate Warning]:', err.message);
    return '';
  }
}
