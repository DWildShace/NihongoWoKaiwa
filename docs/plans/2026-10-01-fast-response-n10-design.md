# Tài Liệu Thiết Kế: Kiến Trúc Phản Xạ Kép & Tổng Kết Cuối Phiên (N = 10)

- **Dự án:** NihonSpeak (`luyen_noi_giao_tiep`)
- **Ngày lập:** 2026-10-01
- **Trạng thái:** Đã chốt qua Brainstorming (Validated)

---

## 1. Tóm Tắt Thấu Hiểu (Understanding Summary)
1. **Mục tiêu:** Giải quyết triệt để độ trễ phản hồi (từ 3–5 giây xuống còn < 0.6 giây) khi luyện nói tiếng Nhật phản xạ.
2. **Nguyên nhân cũ:** Từng câu nói đều gửi file ghi âm WebM nặng lên Gemini và bắt Gemini phân tích 4 tác vụ nặng trong cùng một prompt, gây khoảng lặng kéo dài.
3. **Mô hình mới:**
   - **Từng lượt (Fast-turn Loop):** Text-first, người học nói -> nhận diện chữ trình duyệt -> gửi text lên server -> AI chỉ sinh 1 câu đối đáp + 1 câu gợi ý trả lời tự nhiên duy nhất. Tự động phát âm thanh ngay lập tức.
   - **Ghi nhận phiên:** Mọi câu thoại được ghi vào `sessionHistory`.
   - **Tổng kết cuối phiên (Session Review at N = 10):** Sau 10 lượt thoại (hoặc khi bấm kết thúc sớm), gửi toàn bộ lịch sử lên AI để nhận bản báo cáo phân tích toàn diện.

---

## 2. Các Giả Định Kỹ Thuật (Assumptions)
- Trình duyệt chạy Chrome/Edge có sẵn `webkitSpeechRecognition` hỗ trợ tiếng Nhật (`lang: 'ja-JP'`).
- AI model: Ưu tiên `gemini-3.8-flash` (nếu còn quota) -> tự động fallback sang `gemini-3.5-flash` tốc độ cao. Thiết kế module hỗ trợ mở rộng sang DeepSeek / Groq khi cần.
- Quy trình sư phạm: Nghe chép chính tả (Dictation) $\ge 80\%$ để mở Mic nói, sau đó hội thoại phản xạ nhanh liên tục.

---

## 3. Nhật Ký Quyết Định (Decision Log)

| Hạng mục | Quyết định đã chốt | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Kiến trúc API** | Hybrid Fast-API: `POST /api/chat/fast-turn` & `POST /api/chat/review-session` | Tách biệt hoàn toàn tác vụ phản hồi nhanh (<0.5s) và tác vụ phân tích nặng cuối buổi. |
| **Dung lượng phiên** | $N = 10$ lượt đối đáp | Đủ độ dài cho một kịch bản giao tiếp hoàn chỉnh ngoài đời (chào hỏi, gọi món, trả tiền, tạm biệt...). |
| **Điều khiển linh hoạt** | Có nút "Hoàn thành sớm & Xem nhận xét" | Cho phép người học dừng kịch bản ở bất kỳ lượt nào (ví dụ lượt 4, 6) mà vẫn nhận đầy đủ báo cáo. |
| **Gợi ý trả lời** | Đúng 1 câu gợi ý trả lời chuẩn tự nhiên bản xứ (kèm dịch nghĩa tiếng Việt) | Không gây rối mắt, tạo cảm hứng cho người học nói câu tiếp theo. |
| **Chất lượng Model** | `gemini-3.5-flash` & `gemini-3.8-flash` | Tiếng Nhật chuẩn xác, không bị phụ thuộc vào bản lite vốn có thể cho câu gợi ý kém tự nhiên. |

---

## 4. Kiến Trúc Chi Tiết & Luồng Dữ Liệu

### 4.1. Endpoint 1: `POST /api/chat/fast-turn`
- **Đầu vào (Request):**
  ```json
  {
    "spokenText": "一人です。カウンターは空いていますか？",
    "turnIndex": 1,
    "scenario": { "title": "...", "aiRole": "店員", "userRole": "客", "description": "..." },
    "history": [ ... ]
  }
  ```
- **Xử lý:**
  - Gọi Gemini với prompt rút gọn (chỉ sinh câu đối đáp + 1 gợi ý).
  - Tokenize Furigana & Hiragana bằng Kuromoji.
- **Đầu ra (Response):**
  ```json
  {
    "success": true,
    "data": {
      "nextTurn": {
        "aiSentence": "かしこまりました。カウンター席へどうぞ！",
        "reading": "かしこまりました。かうんたーせきへどうぞ！",
        "furiganaTokens": [ ... ],
        "normalizedHiragana": "かしこまりましたかうんたーせきへどうぞ",
        "vietnamese": "Tôi hiểu rồi ạ. Mời bạn vào quầy bar ngồi nhé!",
        "replyIdeas": [
          { "jp": "ありがとうございます。", "vi": "Cảm ơn bạn." }
        ]
      },
      "turnIndex": 2,
      "isFinalTurn": false
    }
  }
  ```

### 4.2. Endpoint 2: `POST /api/chat/review-session`
- **Đầu vào (Request):**
  ```json
  {
    "scenario": { ... },
    "sessionHistory": [ ... ]
  }
  ```
- **Xử lý:**
  - Gemini đóng vai Master Coach đánh giá toàn diện cả 10 câu.
- **Đầu ra (Response):**
  ```json
  {
    "success": true,
    "data": {
      "overallScore": 92,
      "fluencyFeedback": "...",
      "grammarStrengths": "...",
      "grammarImprovements": "...",
      "naturalNuances": "...",
      "recommendedVocabulary": [ ... ]
    }
  }
  ```

---

## 5. Kế Hoạch Triển Khai (Implementation Steps)
1. **Bước 1 (Backend):** Thêm 2 hàm `generateFastNextTurn` và `generateSessionComprehensiveReview` trong `server/services/geminiService.js`.
2. **Bước 2 (API Routes):** Đăng ký routes `/api/chat/fast-turn` và `/api/chat/review-session` trong `server/routes/chat.js`.
3. **Bước 3 (Frontend State):** Cập nhật `src/App.jsx` quản lý tiến trình `turnIndex` ($1 \to 10$), `sessionHistory`, và cơ chế chuyển lượt tức thì.
4. **Bước 4 (Frontend UI):** 
   - Thêm hiển thị thanh tiến độ `Lượt X/10` và nút "Hoàn thành sớm" trên `DictationSpeakingCard.jsx`.
   - Cập nhật `AICoachingCard.jsx` để hiển thị bản báo cáo tổng kết toàn diện cuối buổi.
5. **Bước 5 (Kiểm thử):** Chạy kiểm tra đo lường độ trễ thực tế (<0.6s) và tính thông suốt qua 10 lượt thoại.
