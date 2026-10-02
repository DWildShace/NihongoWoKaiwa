// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import { getTokenizer } from './services/kuromojiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'NihonSpeak (日本語会話)',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    deepseekConfigured: Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here'),
    preferredProvider: process.env.AI_PROVIDER || 'gemini',
  });
});

// Routes
app.use('/api/chat', chatRouter);

// Khởi động server và làm nóng Kuromoji tokenizer
const server = app.listen(PORT, async () => {
  console.log(`🚀 [BACKEND] NihonSpeak Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔑 [GEMINI] API Key: ${Boolean(process.env.GEMINI_API_KEY) ? 'Đã cấu hình' : 'Chưa cấu hình'}`);
  console.log(`🔑 [DEEPSEEK] API Key: ${Boolean(process.env.DEEPSEEK_API_KEY) ? 'Đã cấu hình' : 'Chưa cấu hình (tùy chọn)'}`);
  console.log(`⚙️ [PROVIDER] AI ưu tiên: ${process.env.AI_PROVIDER || 'gemini'}`);

  try {
    await getTokenizer();
    console.log('🇯🇵 [KUROMOJI] Bộ phân tích từ điển tiếng Nhật đã sẵn sàng!');
  } catch (err) {
    console.error('❌ [KUROMOJI INIT FAILED]:', err.message);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [LỖI CỔNG] Cổng ${PORT} đang bị một tiến trình Node khác chiếm giữ!`);
    console.error(`👉 Bạn có thể đổi PORT=${PORT + 1} trong file .env để chạy ngay lập tức.\n`);
  } else {
    console.error('❌ [SERVER ERROR]:', err.message);
  }
});
