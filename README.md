# 🎙️ NihonSpeak (日本語会話)
### Ứng Dụng Luyện Nói Phản Xạ & Dictation Tiếng Nhật Tương Tác Cùng Gemini AI

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Gemini-Pro%20Multimodal-8e75ff.svg?style=flat-square)](https://ai.google.dev/)

---

## 📖 Giới thiệu

**NihonSpeak** là ứng dụng chuyên sâu rèn luyện phản xạ giao tiếp tiếng Nhật 1-1 với AI theo chu trình kép khoa học:
> **"Nghe Thủng ➔ Mới Bật Miệng Nói"**
1. **Bước 1 (Dictation):** AI phát âm câu tiếng Nhật bản xứ. Bạn phải nghe và gõ lại đạt ít nhất **80% độ khớp** (chuẩn hóa âm đọc Hiragana qua Kuromoji/Wanakana) mới mở khóa micro.
2. **Bước 2 (Speaking):** Bấm giữ micro và nói câu trả lời tiếng Nhật bằng giọng thật.
3. **Bước 3 (AI Coaching):** Gemini Pro nghe file ghi âm, chấm điểm phát âm & ngữ điệu (pitch accent, âm ngắt `っ`, trường âm `ー`), gợi ý ngữ pháp và đối đáp câu tiếp theo.

---

## 🚀 Khởi động nhanh (Quick Start)

### 1. Cấu hình Gemini Pro API Key
Mở file `.env` tại thư mục gốc và dán API Key của bạn:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5001
```
*(Nếu chưa điền API Key, ứng dụng sẽ tự động chạy ở **Chế độ Kịch bản Thông minh có sẵn** để bạn trải nghiệm ngay lập tức).*

### 2. Khởi chạy 1-Click
Nhấp đúp chuột vào file:
👉 **`start.bat`**

Hệ thống sẽ tự động bật đồng thời cả **Backend (Port 5001)** lẫn **Frontend (Port 5174)** và mở trình duyệt lên cho bạn.

---

## 📐 Bố cục màn hình khoa học (75% - 25%)

* **Cột 1 (75% Chiều rộng):**
  * **Hàng 1 (Vùng Tương tác):** Thẻ ngữ cảnh + Nút `🎲 Random ngữ cảnh mới` + Audio Player AI (chỉnh tốc độ 0.75x, 1.0x) + Ô gõ Dictation (nhảy % real-time) + Nút Micro thu âm tiếng Nhật (mở khóa khi ≥80%).
  * **Hàng 2 (Vùng Gia sư AI):** Bảng bóc băng Furigana, chấm điểm phát âm `92/100 🌟`, nhận xét ngữ điệu, và gợi ý câu nói tự nhiên hơn.
* **Cột 2 (25% Chiều rộng):**
  * Dòng thời gian lịch sử hội thoại (Click để nghe lại bất kỳ câu nào).
  * Thanh **Quick Flashcard** (Bôi đen bất kỳ chữ Hán nào để tra cứu và lưu vào sổ tay ôn tập, xuất sang Anki/Quizlet).
