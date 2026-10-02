// server/routes/chat.js
import express from 'express';
import multer from 'multer';
import {
  generateRandomScenario,
  generateFastNextTurn,
  generateSessionComprehensiveReview,
  getAvailableProviders,
} from '../services/aiRouter.js';
import { evaluateUserAudioAndRespond } from '../services/geminiService.js';
import { annotateSentence, normalizeToHiragana, calculateHiraganaSimilarity } from '../services/kuromojiService.js';
import { synthesizeJapaneseAudio, JAPANESE_VOICES } from '../services/ttsService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

/**
 * Lấy danh sách các nhà cung cấp AI đang khả dụng (Gemini / DeepSeek)
 * GET /api/chat/providers
 */
router.get('/providers', (req, res) => {
  res.json({ success: true, data: getAvailableProviders() });
});

/**
 * Lấy danh sách giọng đọc tiếng Nhật Neural
 * GET /api/chat/voices
 */
router.get('/voices', (req, res) => {
  res.json({ success: true, voices: JAPANESE_VOICES });
});

/**
 * Phát âm thanh tiếng Nhật chuẩn Studio bằng Microsoft Edge Neural TTS
 * GET /api/chat/tts?text=...&voice=nanami&rate=1.0
 */
router.get('/tts', async (req, res) => {
  try {
    const text = req.query.text || '';
    const voice = req.query.voice || 'nanami';
    const rate = parseFloat(req.query.rate) || 1.0;

    if (!text.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số text' });
    }

    const audioBuffer = await synthesizeJapaneseAudio(text, { voice, rate });
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[API /chat/tts ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Khởi tạo ngữ cảnh giao tiếp ngẫu nhiên
 * POST /api/chat/start
 */
router.post('/start', async (req, res) => {
  try {
    const { level = 'all', topic = 'all', provider } = req.body || {};
    const scenarioData = await generateRandomScenario({ level, topic, provider });
    res.json({ success: true, data: scenarioData });
  } catch (err) {
    console.error('[API /chat/start ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * [PHẢN XẠ NHANH] Lượt đối đáp tức thì (<0.5s) bằng Text-first
 * POST /api/chat/fast-turn
 */
router.post('/fast-turn', async (req, res) => {
  try {
    const { spokenText = '', turnIndex = 1, totalTurns = 10, history = [], scenario = {}, provider } = req.body;
    const result = await generateFastNextTurn({
      spokenText,
      turnIndex,
      totalTurns,
      history,
      scenario,
      provider,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[API /chat/fast-turn ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * [TỔNG KẾT CUỐI PHIÊN] Đánh giá toàn diện sau khi hoàn thành 10 lượt hoặc kết thúc sớm
 * POST /api/chat/review-session
 */
router.post('/review-session', async (req, res) => {
  try {
    const { scenario = {}, sessionHistory = [], provider } = req.body;
    const review = await generateSessionComprehensiveReview({
      scenario,
      sessionHistory,
      provider,
    });
    res.json({ success: true, data: review });
  } catch (err) {
    console.error('[API /chat/review-session ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Nộp file âm thanh người học, AI nghe và phản hồi
 * POST /api/chat/respond
 */
router.post('/respond', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    const history = req.body.history ? JSON.parse(req.body.history) : [];
    const scenario = req.body.scenario ? JSON.parse(req.body.scenario) : {};
    const spokenText = req.body.spokenText || '';

    const result = await evaluateUserAudioAndRespond({
      audioBuffer: audioFile?.buffer,
      mimeType: audioFile?.mimetype || 'audio/webm',
      history,
      scenario,
      spokenText,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[API /chat/respond ERROR]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * So sánh độ tương đồng Hiragana
 * POST /api/chat/similarity
 */
router.post('/similarity', async (req, res) => {
  try {
    const { input = '', target = '' } = req.body;
    const inputHira = await normalizeToHiragana(input);
    const targetHira = await normalizeToHiragana(target);
    const score = calculateHiraganaSimilarity(inputHira, targetHira);

    res.json({
      success: true,
      inputHira,
      targetHira,
      score,
      isPassed: score >= 80,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Tokenize văn bản tiếng Nhật (Furigana + Hiragana)
 * POST /api/tokenize
 */
router.post('/tokenize', async (req, res) => {
  try {
    const { text = '' } = req.body;
    const annotated = await annotateSentence(text);
    const normalizedHira = await normalizeToHiragana(text);

    res.json({
      success: true,
      data: {
        ...annotated,
        normalizedHiragana: normalizedHira,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
