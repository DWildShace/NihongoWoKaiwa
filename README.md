# 🎙️ NihongoWoKaiwa (日本語会話)
### Luyện Phản Xạ Nói & Nghe Chép Chính Tả Tiếng Nhật Thông Minh Cùng AI
### *AI-Powered Japanese Shadowing, Dictation & Reflex Speaking Platform*

<div align="center">

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-V3-4D6BFE.svg?style=flat-square)](https://platform.deepseek.com/)
[![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash--Lite-8e75ff.svg?style=flat-square)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)

[**🇻🇳 Tiếng Việt**](#-tiếng-việt) • [**🇬🇧 English**](#-english)

</div>

---

## 🇻🇳 Tiếng Việt

### 📖 Giới thiệu
**NihongoWoKaiwa** là nền tảng luyện phản xạ giao tiếp tiếng Nhật chuyên sâu áp dụng nguyên lý học ngôn ngữ tự nhiên:
> **"Nghe thủng câu chữ (Dictation) ➔ Mới tự tin bật miệng nói (Speaking)"**

Ứng dụng kết hợp hai mô hình trí tuệ nhân tạo hàng đầu (**DeepSeek-V3** làm động cơ hội thoại chính và **Google Gemini** làm hệ thống dự phòng tự động), phân tích hình thái học tiếng Nhật bằng **Kuromoji**, giọng đọc tự nhiên chuẩn Studio qua **Microsoft Edge Neural TTS**, cùng giao diện mang cảm hứng **Mũ Rơm One Piece & Sóng Biển Đại Dương**.

---

### ✨ Tính năng nổi bật

1. **Chu trình luyện tập phản xạ kép (Dual-Engine Shadowing)**:
   - **Bước 1 - Nghe & Gõ Dictation:** Nghe câu tiếng Nhật bản xứ, gõ lại bằng Romaji (tự động chuyển Hiragana/Katakana). Phải đạt độ khớp **≥ 80%** (so sánh Hiragana trơn qua Kuromoji) mới mở khóa Micro.
   - **Bước 2 - Nói phản xạ thực tế:** Bấm Micro và nói câu đối đáp bằng tiếng Nhật (nhận diện qua Web Speech API siêu nhạy).
   - **Bước 3 - Nhận xét & Chấm điểm tức thì (<0.5s):** AI phân tích ngữ pháp, bóc băng Furigana, chỉ ra điểm mạnh/cần sửa và tiếp tục câu đối đáp ngẫu nhiên.
   - **Cơ chế kết thúc thông minh:** Tự động phát hiện lời chào tạm biệt kết thúc hội thoại tự nhiên khi ngữ nghĩa đạt điểm dừng, tránh lặp vòng vo.

2. **Hệ thống AI kép thông minh (DeepSeek-V3 + Gemini)**:
   - Ưu tiên DeepSeek-V3 cho phản hồi tự nhiên, chuẩn văn phong hội thoại Nhật Bản.
   - Tự động chuyển đổi mượt mà (Failover) sang Gemini 3.5 Flash-Lite nếu gặp sự cố mạng hoặc quá tải API.

3. **Thanh tạo nhanh Flashcard nổi (Floating Quick Card)**:
   - Bôi đen bất kỳ từ vựng hoặc câu tiếng Nhật nào trên màn hình để mở thẻ tạo Flashcard nổi sang trọng.
   - Tự động phân tích Furigana âm đọc qua Kuromoji.
   - Tích hợp nút **`✨ Dịch AI`** dịch nghĩa tiếng Việt tức thì (~300ms) hoặc tự động gán nghĩa theo ngữ cảnh câu thoại.
   - Hỗ trợ phím tắt: `Enter` để lưu nhanh, `Esc` để hủy.

4. **Sổ tay từ vựng & Xuất file Anki**:
   - Lưu trữ toàn bộ Flashcard vào cả **Cache trình duyệt (localStorage)** lẫn **Ổ cứng máy tính (Disk JSON)**.
   - Lật thẻ xem nghĩa, phát âm lại câu, xuất file `.txt` chuẩn định dạng thẻ Anki Deck 1-click.

5. **Kho lưu trữ chủ đề đã học & Trung tâm ôn tập (Study History)**:
   - Tự động lưu vĩnh viễn toàn bộ các phiên học (kịch bản, toàn bộ câu thoại, điểm số, bảng nhận xét của AI).
   - Cho phép mở lại và tiếp tục luyện tập với các kịch bản cũ bất kỳ lúc nào.

6. **Giao diện One Piece & Sóng biển (Nautical Aesthetics)**:
   - Tích hợp chế độ **Lướt Sóng (Ẩn chữ)** để rèn luyện đôi tai phản xạ mà không nhìn trộm phụ đề trước (`Alt + T`).
   - Bộ biểu tượng vẽ tay độc quyền: Mũ Rơm Luffy 👒, Thuyền buồm Thousand Sunny ⛵, Mũ bác sĩ Chopper 🦌, Ngọn sóng biển Ukiyo-e 🌊.

---

### 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Lucide Icons, Wanakana.
- **Backend:** Node.js, Express, Kuromoji (Tokenizing & Furigana), Microsoft Edge Neural TTS.
- **AI Engines:** DeepSeek-V3 API, Google Generative AI (Gemini).
- **Lưu trữ dữ liệu:** LocalStorage song hành Disk Persistence (`server/data/`).

---

### 🚀 Cài đặt & Khởi chạy nhanh

#### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.0 trở lên.
- **Trình duyệt**: Google Chrome, Edge hoặc Brave (hỗ trợ tốt nhất Web Speech API).

#### 2. Cài đặt mã nguồn
```bash
# Clone repository
git clone https://github.com/DWildShace/NihongoWoKaiwa.git
cd NihongoWoKaiwa

# Cài đặt thư viện dependencies
npm install
```

#### 3. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Điền khóa API của bạn vào file `.env`:
```env
PORT=5001
AI_PROVIDER=deepseek

# API Key DeepSeek (Lấy từ https://platform.deepseek.com/)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# API Key Google Gemini (Lấy miễn phí từ https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 4. Khởi chạy ứng dụng
Chạy cả Backend và Frontend song song:
```bash
npm run dev:all
```
Hoặc trên Windows, bạn chỉ cần nhấp đúp vào file:
👉 **`start.bat`**

Truy cập giao diện tại: **`http://localhost:5173`** (hoặc cổng hiển thị trên terminal).

---
---

## 🇬🇧 English

### 📖 Overview
**NihongoWoKaiwa** is an advanced interactive Japanese speaking and shadowing platform built around an essential language acquisition rule:
> **"Understand & Dictate First ➔ Unlock Confident Speaking"**

The application leverages a dual-engine AI architecture (**DeepSeek-V3** as primary conversational AI with **Google Gemini** as automatic failover), Japanese morphological analysis via **Kuromoji**, studio-grade speech synthesis via **Microsoft Edge Neural TTS**, and a charming **One Piece & Ocean Waves** nautical theme.

---

### ✨ Key Features

1. **Dual-Cycle Reflex Training**:
   - **Step 1 - Dictation (Listening & Typing):** Listen to native Japanese audio, type what you hear in Romaji (auto-converted to Kana). Attain at least **80% Hiragana similarity** to unlock the microphone.
   - **Step 2 - Speech Reflex:** Press the microphone and respond verbally in natural Japanese.
   - **Step 3 - Instant Feedback (<0.5s):** AI analyzes pronunciation accuracy, attaches Furigana readings, gives tips on pitch accents and particles, then advances the conversation.
   - **Natural Conversation Ending:** Automatically identifies farewell cues and gracefully wraps up the dialogue when reaching a semantic conclusion.

2. **Dual AI Dispatcher (DeepSeek-V3 + Gemini)**:
   - Primary: DeepSeek-V3 for nuanced, conversational Japanese phrasing.
   - Fallback: Automatic zero-downtime switchover to Gemini 3.5 Flash-Lite if API limits or network issues occur.

3. **Floating Quick Flashcard Widget**:
   - Select any Japanese word or phrase to bring up an ergonomic floating flashcard creator.
   - Automatic Furigana and reading extraction via Kuromoji.
   - Built-in **`✨ AI Translate`** button for instant Vietnamese gloss (~300ms) or automatic sentence context mapping.
   - Keyboard shortcuts: `Enter` to save, `Esc` to dismiss.

4. **Flashcard Notebook & Anki Export**:
   - Flashcards persist in both browser `localStorage` and computer disk storage (`server/data/flashcards.json`).
   - Flip-card review mode, studio pronunciation replay, and 1-click export to Anki deck format (`.txt`).

5. **Study History & Scenario Replay**:
   - Automatically archives completed conversations, scores, and coaching feedback permanently to hardware disk storage.
   - Replay and practice previous scenarios at any time.

6. **One Piece & Ocean Waves Theme (Nautical Aesthetics)**:
   - **Wave Surfing Mode (`Alt + T`):** Hide text transcripts to sharpen ear-training and speaking instincts without peeking.
   - Custom SVG art: Luffy's Straw Hat 👒, Thousand Sunny ⛵, Chopper's Medical Hat 🦌, Ukiyo-e Ocean Waves 🌊.

---

### 🛠️ Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Lucide Icons, Wanakana.
- **Backend:** Node.js, Express, Kuromoji Tokenizer, Microsoft Edge Neural TTS.
- **AI Models:** DeepSeek-V3 API, Google Generative AI (Gemini 3.5 Flash-Lite).
- **Data Persistence:** Dual Storage (Browser LocalStorage + Server Disk JSON).

---

### 🚀 Getting Started

#### 1. Prerequisites
- **Node.js**: v18.0 or newer.
- **Browser**: Google Chrome, Microsoft Edge, or Brave (recommended for Web Speech API support).

#### 2. Installation
```bash
git clone https://github.com/DWildShace/NihongoWoKaiwa.git
cd NihongoWoKaiwa
npm install
```

#### 3. Configuration
Copy the environment template:
```bash
cp .env.example .env
```
Add your API keys in `.env`:
```env
PORT=5001
AI_PROVIDER=deepseek

# DeepSeek API Key (from https://platform.deepseek.com/)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Google Gemini API Key (free from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 4. Run Development Servers
Start both backend and frontend concurrently:
```bash
npm run dev:all
```
*(On Windows, you can simply double-click `start.bat`)*

Open your browser at: **`http://localhost:5173`**

---

### 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
Made with ❤️ by <strong>Nguyễn Văn Sơn (DWildShace)</strong>
</div>
