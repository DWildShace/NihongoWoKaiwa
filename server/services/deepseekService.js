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
 */
export async function generateDeepSeekFastNextTurn({
  spokenText = '',
  turnIndex = 1,
  totalTurns = 10,
  history = [],
  scenario = {},
  mode = 'roleplay',
}) {
  const actualUserText = (spokenText || '').trim() || 'はい';
  const isDeepTalk =
    scenario.mode === 'deep_talk' ||
    mode === 'deep_talk' ||
    ['social', 'chitchat', 'deep_talk', 'lifestyle', 'entertainment'].includes(scenario.topic);

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

  const systemPrompt = isDeepTalk
    ? `Bạn là một người bạn / đồng nghiệp Nhật Bản thân thiện, ấm áp và cởi mở, đang trò chuyện làm quen, kết bạn và chia sẻ sâu sắc với "${scenario.userRole || 'bạn của mình'}".
Bối cảnh cuộc trò chuyện: "${scenario.title || 'Trò chuyện kết bạn'}" - ${scenario.description || ''}.
Lượt hiện tại: ${turnIndex}/${totalTurns}.

QUY TẮC HỘI THOẠI GIAO TIẾP SÂU & KẾT BẠN HAI CHIỀU (RẤT QUAN TRỌNG):
1. TƯƠNG TÁC HAI CHIỀU THỰC SỰ: Bạn là một NGƯỜI BẠN bình đẳng, không phải nhân viên dịch vụ. Người học có thể hỏi bạn bất cứ điều gì (về bạn, quê quán, sở thích, suy nghĩ...). Hãy lắng nghe và trả lời chân thành, tự nhiên.
2. AIZUCHI & CẢM XÚC BẢN XỨ: Luôn mở đầu câu thoại bằng thán từ hoặc từ đệm cảm xúc tự nhiên của người Nhật (ví dụ: へえ、そうなんですか！/ 分かります！/ いいですね！/ ええ、実は… / すごい！/ なるほど〜).
3. CHIA SẺ BẢN THÂN: Kể một ý ngắn gọn về sở thích, trải nghiệm, hoặc góc nhìn của chính bạn để cuộc nói chuyện có tính chia sẻ qua lại.
4. LUÔN HỎI GỢI MỞ NGƯỢC LẠI (Follow-up Question): Sau khi trả lời hoặc chia sẻ, BẮT BUỘC kết thúc câu thoại bằng một câu hỏi gợi mở thân thiện hướng về người học (ví dụ: 〜さんはどうですか？ / 普段どんな〜をしますか？ / どうして〜が好きになったんですか？ / 週末は何をする予定ですか？).
5. KHÔNG KẾT THÚC SỚM: Hãy duy trì trò chuyện mượt mà qua các lượt, chỉ chào tạm biệt khi chạm lượt cuối (${totalTurns}) hoặc khi người học chủ động chào tạm biệt.
6. GỢI Ý TRẢ LỜI CÓ HỎI NGƯỢC (replyIdea): Gợi ý cho người học 1 câu trả lời tự nhiên CÓ KÈM CÂU HỎI NGƯỢC LẠI BẠN để người học luyện phản xạ dẫn dắt cuộc trò chuyện (ví dụ: "私も〜が好きです。〜さんは？").

Định dạng JSON bắt buộc:
{
  "aiSentence": "Câu thoại tiếng Nhật tự nhiên, có aizuchi, chia sẻ và câu hỏi gợi mở",
  "vietnamese": "Dịch nghĩa tiếng Việt của câu AI",
  "isCompleted": false,
  "replyIdea": {
    "jp": "Câu gợi ý trả lời + hỏi ngược lại bạn",
    "vi": "Dịch tiếng Việt"
  }
}`
    : `Bạn là đối tác giao tiếp tiếng Nhật bản xứ, đang nhập vai "${scenario.aiRole || 'Đối tác'}" để trò chuyện trực tiếp với "${scenario.userRole || 'Khách/Học viên'}".
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
    { maxTokens: 600, temperature: 0.7 }
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
3. Phân tích ngữ pháp & từ vựng (grammarStrengths): chỉ ra các điểm người học đã dùng đúng, phù hợp hoàn cảnh (trích dẫn câu học viên dùng đúng trong ngoặc 「...」).
4. TRỌNG TÂM CẢI THIỆN & SỬA LỖI (grammarImprovements & detailedImprovements):
   - Phân tích sâu sắc các điểm học viên dùng từ chưa chuẩn, sai ngữ pháp, hoặc thiếu tự nhiên theo từng lượt thoại cụ thể.
   - "grammarImprovements": Chuỗi tổng hợp có gạch đầu dòng rõ ràng theo lượt (ví dụ: "• Lượt 4: ... \n• Lượt 6: ...").
   - "detailedImprovements": Mảng các luận điểm cải thiện chi tiết theo định dạng:
     [
       {
         "turn": 4,
         "userSaid": "Câu học viên đã nói chưa tự nhiên",
         "corrections": ["Câu chuẩn 1 của người bản xứ", "Câu chuẩn 2 (nếu có)"],
         "explanation": "Lý do vì sao câu học viên nói chưa đúng và cách người Nhật diễn đạt tự nhiên hơn trong ngữ cảnh này."
       }
     ]
5. Sắc thái tự nhiên của người Nhật (naturalNuances): chia sẻ bí quyết để nói chuyện mượt mà, đúng chuẩn văn hóa bản xứ hơn (trích dẫn cụm từ trong ngoặc 「...」).
6. BẮT BUỘC: Đề xuất 4-6 từ vựng hoặc mẫu câu giao tiếp đắt giá nhất (recommendedVocabulary) từ chính buổi học này để người học lưu vào Flashcard ôn tập:
   - "word": Từ vựng hoặc cụm từ Kanji/Kana tiếng Nhật chuẩn (ví dụ: 席を譲る, かしこまりました, お気をつけて).
   - "reading": Cách đọc Hiragana chuẩn xác (ví dụ: せきをゆずる, かしこまりました, おきをつけて).
   - "meaning": Ý nghĩa tiếng Việt súc tích, dễ hiểu trong ngữ cảnh này.

Định dạng JSON bắt buộc:
{
  "overallScore": 88,
  "fluencyFeedback": "Nhận xét độ trôi chảy...",
  "grammarStrengths": "Điểm mạnh ngữ pháp...",
  "grammarImprovements": "• Lượt 4: ... \n• Lượt 6: ...",
  "detailedImprovements": [
    {
      "turn": 4,
      "userSaid": "Câu chưa tự nhiên",
      "corrections": ["Câu chuẩn 1", "Câu chuẩn 2"],
      "explanation": "Giải thích chi tiết..."
    }
  ],
  "naturalNuances": "Bí quyết nói tự nhiên...",
  "recommendedVocabulary": [
    { "word": "席を譲る", "reading": "せきをゆずる", "meaning": "Nhường ghế" },
    { "word": "助かる", "reading": "たすかる", "meaning": "Được cứu giúp / May mắn có người giúp" }
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
    detailedImprovements: Array.isArray(parsed.detailedImprovements) ? parsed.detailedImprovements : [],
    naturalNuances: parsed.naturalNuances || 'Có thể kết hợp thêm các từ đệm như あのう、ええと để cuộc nói chuyện tự nhiên hơn.',
    recommendedVocabulary: vocabList,
    provider: 'deepseek',
  };
}

/**
 * [DEEPSEEK SCENARIO] Khởi tạo ngữ cảnh ngẫu nhiên bằng DeepSeek-V3
 * Hỗ trợ 2 chế độ: 'roleplay' (tình huống dịch vụ đời sống) & 'deep_talk' (giao tiếp sâu, làm quen, kết bạn)
 */
export async function generateDeepSeekRandomScenario({ level = 'all', topic = 'all', mode = 'roleplay' } = {}) {
  const isDeepTalk =
    mode === 'deep_talk' ||
    ['social', 'chitchat', 'deep_talk', 'lifestyle', 'entertainment'].includes(topic);

  const topicGuidelines = {
    social: 'Làm quen & Kết bạn mới (初対面・自己紹介: chào hỏi lần đầu, tự giới thiệu, hỏi thăm quê quán, sở thích, lý do sang Nhật, trường học/công ty).',
    chitchat: 'Tán gẫu & Đời sống hàng ngày (雑談・週末・趣味: trò chuyện thân mật với bạn bè, đồng nghiệp giờ nghỉ trưa, nói về anime, manga, nhạc, kế hoạch cuối tuần, quán ăn ngon).',
    deep_talk: 'Trò chuyện sâu & Chia sẻ tâm sự (深い対話・日本生活: tâm sự về trải nghiệm cuộc sống ở Nhật, những bỡ ngỡ văn hóa, khó khăn khi học tiếng, ước mơ tương lai, sự gắn kết cảm xúc).',
    lifestyle: 'Trải nghiệm sống & Văn hóa Nhật (日本生活・文化: thói quen ăn uống, lễ hội, sự khác biệt văn hóa, bốn mùa ở Nhật).',
    entertainment: 'Ẩm thực & Giải trí (グルメ・エンタメ: món ăn yêu thích, phim ảnh, âm nhạc, cosplay, du lịch tự túc).',
    daily: 'Đời sống & Mua sắm (コンビニ・買い物: Konbini, siêu thị, ngân hàng, bưu điện, tiệm giặt).',
    dining: 'Nhà hàng & Quán ăn (飲食店: Quán Ramen, Sushi, Izakaya, gọi món, thanh toán).',
    travel: 'Du lịch & Ga tàu (旅行・駅: Ga tàu điện, Shinkansen, hỏi đường, khách sạn, mua vé tham quan).',
    business: 'Công sở & Phỏng vấn (ビジネス・面接: Phỏng vấn xin việc, trao đổi với đồng nghiệp/cấp trên).',
    medical: 'Y tế & Thủ tục (病院・手続き: Phòng khám, nhà thuốc, mô tả triệu chứng bệnh, làm thủ tục Shi-yakusho).',
    all: isDeepTalk
      ? 'Giao lưu kết bạn, làm quen bạn mới hoặc tán gẫu đời sống thân mật.'
      : 'Tình huống giao tiếp đời sống thực tế phong phú tại Nhật Bản.',
  };

  const selectedTopicDesc = topicGuidelines[topic] || topicGuidelines.all;

  const prompt = isDeepTalk
    ? `Bạn là chuyên gia sư phạm tiếng Nhật bản xứ và nhà thiết kế hội thoại giao tiếp thực chiến.
Hãy tạo MỘT tình huống "GIAO TIẾP SÂU, LÀM QUEN & KẾT BẠN" (Deep Social Chit-Chat / Connection):
- Cấp độ: ${level}
- Chủ đề: ${topic} (${selectedTopicDesc})
- Mục tiêu: Hai người trò chuyện cởi mở, bình đẳng như hai người bạn, đồng nghiệp hoặc bạn cùng lớp.
- AI đóng vai: Một người bạn Nhật Bản cởi mở, thân thiện, tò mò tìm hiểu về người học (vd: 友人 (Bạn bè), 同僚 (Đồng nghiệp), クラスメイト (Bạn cùng lớp)).
- Người học đóng vai: Chính bản thân người học (留学生 (Du học sinh) hoặc 会社員 (Nhân viên mới)).
- Câu mở đầu của AI: Chào hỏi thân thiện, bắt chuyện tự nhiên và mở lời bằng 1 câu hỏi làm quen gợi mở.
- Gợi ý trả lời (replyIdea): Gợi ý câu trả lời tự nhiên CÓ KÈM CÂU HỎI NGƯỢC LẠI AI (để người học luyện phản xạ hỏi - đáp hai chiều).

Định dạng JSON bắt buộc:
{
  "title": "Tên tình huống tiếng Nhật kèm dịch (vd: 初対面の挨拶と趣味の話 (Làm quen và nói về sở thích))",
  "level": "${level !== 'all' ? level : 'N4'}",
  "topic": "${topic !== 'all' ? topic : 'social'}",
  "mode": "deep_talk",
  "aiRole": "Vai AI thân thiện (vd: 日本人の友人 (Bạn người Nhật))",
  "userRole": "Vai người học (vd: 留学生 (Du học sinh))",
  "description": "Mô tả bối cảnh ngắn gọn bằng tiếng Việt (1-2 câu)",
  "firstTurn": {
    "aiSentence": "Câu mở đầu tiếng Nhật tự nhiên, thân thiện và có câu hỏi mở",
    "vietnamese": "Dịch nghĩa tiếng Việt",
    "replyIdeas": [
      { "jp": "Câu gợi ý trả lời + hỏi ngược lại AI (ví dụ: はじめまして！私はベトナムから来ました。〜さんは？)", "vi": "Dịch tiếng Việt" }
    ]
  }
}`
    : `Bạn là chuyên gia sư phạm tiếng Nhật bản xứ và nhà thiết kế hội thoại thực chiến.
Hãy tạo MỘT tình huống giao tiếp đời sống ngẫu nhiên:
- Cấp độ yêu cầu: ${level}
- Chủ đề: ${topic} (${selectedTopicDesc})

Định dạng JSON bắt buộc:
{
  "title": "Tên tình huống tiếng Nhật kèm dịch (vd: コンビニでのお会計 (Thanh toán tại Konbini))",
  "level": "${level !== 'all' ? level : 'N4'}",
  "topic": "${topic !== 'all' ? topic : 'daily'}",
  "mode": "roleplay",
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
    { maxTokens: 600, temperature: 0.8 }
  );

  const data = safeJsonParse(content, {});
  const aiText = data.firstTurn?.aiSentence || (isDeepTalk ? 'こんにちは！はじめまして、どうぞよろしくお願いします。' : 'いらっしゃいませ。');
  const annotated = await annotateSentence(aiText);
  const normalizedHira = await normalizeToHiragana(aiText);

  return {
    scenarioId: 'deepseek_' + Date.now(),
    scenario: {
      title: data.title,
      level: data.level || (level !== 'all' ? level : 'N4'),
      topic: data.topic || (topic !== 'all' ? topic : (isDeepTalk ? 'social' : 'daily')),
      mode: isDeepTalk ? 'deep_talk' : 'roleplay',
      aiRole: data.aiRole || (isDeepTalk ? '友人' : '店員'),
      userRole: data.userRole || (isDeepTalk ? '留学生' : '客'),
      description: data.description,
    },
    firstTurn: {
      aiSentence: aiText,
      reading: annotated.reading,
      furiganaTokens: annotated.furiganaTokens,
      normalizedHiragana: normalizedHira,
      vietnamese: data.firstTurn?.vietnamese || '',
      replyIdeas: data.firstTurn?.replyIdeas?.slice(0, 1) || [
        {
          jp: isDeepTalk ? 'はじめまして！よろしくお願いします。〜さんはお名前は何ですか？' : 'はい、お願いします。',
          vi: isDeepTalk ? 'Rất vui được gặp bạn! Xin bạn giúp đỡ. Bạn tên là gì thế ạ?' : 'Vâng, làm phiền bạn ạ.',
        },
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
