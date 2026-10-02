# 🎙️ NihonSpeak (日本語会話) - Tài Liệu Thiết Kế Kỹ Thuật (DESIGN.md)

## 1. 📌 Tóm Tắt Thấu Hiểu Dự Án (Understanding Summary)
* **Tên ứng dụng:** NihonSpeak (日本語会話) - Ứng dụng Luyện Nói Giao Tiếp Tiếng Nhật Tương Tác Cùng Gemini AI.
* **Mục tiêu cốt lõi:** Giải quyết điểm yếu "nghe chưa thủng đã vội nói" thông qua chu trình phản xạ kép:
  1. **Nghe chép chính tả (Dictation ≥ 80%):** Bắt buộc người học nghe rõ và gõ đúng câu thoại của AI trước.
  2. **Nói phản xạ (Speaking Response):** Mở khóa micro để người học dùng giọng thật đáp lại lời đối thoại.
* **Hình thức hội thoại:** Nhập vai mở nhiều lượt (Multi-turn Open Roleplay) – Gemini Pro đóng vai đối tác trò chuyện thực tế và dẫn dắt câu chuyện tự nhiên theo từng câu trả lời của người học.
* **Khởi tạo:** 1 nút bấm duy nhất **"🎲 Random ngữ cảnh"** để vào bài ngay lập tức không cần cấu hình phức tạp.
* **Non-Goals (Ranh giới không làm):**
  - Không cho phép gõ phím ở bước Nói (bắt buộc rèn luyện phát âm qua micro).
  - Không xây dựng menu chọn bài rườm rà ở giai đoạn khởi đầu, tập trung tối đa vào tốc độ vào học và trải nghiệm âm thanh.

---

## 2. 📝 Nhật Ký Quyết Định (Decision Log)

| STT | Vấn đề / Tính năng | Lựa chọn quyết định | Các phương án đã cân nhắc | Lý do lựa chọn |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Mô hình hội thoại | **Hội thoại nhập vai tự do (Multi-turn Open Roleplay)** | Kịch bản cố định (Scripted Drill) | Mang lại trải nghiệm phản xạ thực chiến, kích thích tư duy giao tiếp đa dạng thay vì học vẹt. |
| **2** | Nhận diện giọng nói ở Bước 2 | **Chỉ thuần thu âm giọng nói (Speech-only)** | Cho phép gõ phím dự phòng | Ép người học phải mở miệng phát âm tiếng Nhật, tối ưu mục tiêu luyện nói. |
| **3** | Chuẩn hóa chấm % Dictation | **Chuẩn hóa Hiragana qua Kuromoji / Wanakana** | Bắt buộc đúng 100% Kanji | Người học gõ Kanji hay Hiragana đều được tính điểm công bằng dựa trên âm đọc thực tế. |
| **4** | Phản hồi của AI sau lượt nói | **Nhận xét độ tự nhiên/ngữ pháp tại chỗ + Đáp lời tiếp theo** | Chỉ đáp lời tiếp theo như người thường | Người học cần biết ngay mình phát âm/dùng từ sai chỗ nào để sửa ngay trong ngữ cảnh. |
| **5** | Khởi tạo bối cảnh | **1 nút "Random ngữ cảnh" duy nhất** | Bộ lọc cấp độ N5-N1 & chủ đề | Giảm ma sát (friction), bấm 1 phát là vào luyện ngay với tình huống bất ngờ. |
| **6** | Kiến trúc Audio | **Thu âm file thật gửi Gemini Multimodal** | Web Speech API của trình duyệt | Gemini nghe trực tiếp file âm thanh thật nên chấm được **ngữ điệu (pitch accent), âm ngắt (っ), trường âm (ー)** mà trình duyệt không làm được. Giọng AI tự nhiên chuẩn bản xứ. |
| **7** | Bố cục giao diện (Layout) | **2 Cột: Cột 1 (75%) chia 2 Hàng; Cột 2 (25%)** | 1 Cột tập trung / Bố cục Chat feed | Không gian luyện tập rộng rãi ở 75%, phân tách trực quan giữa Vùng Luyện Tập (Hàng 1) và Vùng Gia Sư Nhận Xét (Hàng 2), Cột 2 lưu lịch sử gọn gàng. |

---

## 3. 🏛️ Kiến Trúc Hệ Thống & Công Nghệ (System Architecture)

### 3.1. Frontend (`/src`)
* **Core:** React 19, Vite, TailwindCSS v4 (kế thừa tiêu chuẩn từ `luyen_go_phu_de`).
* **Âm thanh:** `MediaRecorder API` thu âm giọng nói định dạng `audio/webm;codecs=opus` (hoặc `wav`).
* **Xử lý tiếng Nhật phía Client:** `wanakana` hỗ trợ gõ Romaji tự chuyển Hiragana mượt mà không lỗi gạch chân IME.
* **Icons & Animation:** `lucide-react` (Mic, Play, RefreshCw, Sparkles, Volume2).

### 3.2. Backend (`/server`)
* **Runtime:** Node.js, Express.js (cổng `PORT=5001`), `dotenv`, `cors`.
* **AI Engine:** Google Gen AI SDK (`@google/genai` hoặc `@google/generative-ai`), model `gemini-1.5-pro` hoặc `gemini-2.0-flash` Multimodal.
* **Xử lý từ loại:** `kuromoji` phân tích ngữ pháp, bóc tách Furigana và chuyển văn bản Kanji thành Hiragana.
* **Audio Synthesis (TTS):** Sử dụng audio trả về từ Gemini Multimodal hoặc tích hợp engine Neural voice chuẩn Nhật (Edge-TTS).

---

## 4. 📐 Chi Tiết Bố Cục Giao Diện (Layout Specifications)

Bố cục màn hình áp dụng tỷ lệ vàng **75% - 25%**:

```
+-------------------------------------------------------------------------------+-----------------------+
|  HEADER: NihonSpeak (日本語会話)  |  Status: Gemini Connected  |  [Sổ Từ Vựng]  |  Tình huống: Đang chạy|
+-------------------------------------------------------------------------------+-----------------------+
|  CỘT 1 (75% Chiều Rộng): KHÔNG GIAN TƯƠNG TÁC CHÍNH                           |  CỘT 2 (25% Chiều Rộng)
|                                                                               |  SIDEBAR TIẾN TRÌNH   |
|  +-------------------------------------------------------------------------+  |  +-----------------+  |
|  | HÀNG 1: KHU VỰC NGHE - GÕ DICTATION & BẤM MIC NÓI                       |  |  | DANH SÁCH       |  |
|  | - Thẻ Ngữ cảnh: Tên tình huống + Vai diễn AI & Bạn + Nút [🎲 Random mới]|  |  | NGỮ CẢNH        |  |
|  | - Audio AI Player: Sóng âm + Nút nghe lại + Tốc độ (0.75x, 1.0x)        |  |  | & BỐI CẢNH      |  |
|  | - Ô gõ Dictation (Wanakana) + Thanh % đo độ khớp Realtime (Mục tiêu ≥80%)|  |  |                 |  |
|  | - Nút "💡 Gợi ý âm đọc"                                                  |  |  +-----------------+  |
|  | - NÚT MICRO THU ÂM TIẾNG NHẬT (Mở khóa khi ≥80%, hiệu ứng sóng âm khi nói)|  |  | DÒNG THỜI GIAN  |  |
|  | - Nút "Gợi ý cách trả lời" (Mớm ý tưởng tiếng Nhật/Việt)                |  |  | LỊCH SỬ         |  |
|  +-------------------------------------------------------------------------+  |  | HỘI THOẠI       |  |
|                                                                               |  | (Click nghe lại |  |
|  +-------------------------------------------------------------------------+  |  |  từng câu cũ)   |  |
|  | HÀNG 2: BẢNG PHÂN TÍCH CHI TIẾT TỪ GEMINI (AI COACHING)                 |  |  |                 |  |
|  | - Bóc băng giọng nói: Câu tiếng Nhật bạn vừa phát âm (kèm Furigana)     |  |  |                 |  |
|  | - Chấm điểm phát âm: Badge điểm số (vd: 92/100 🌟)                      |  |  |                 |  |
|  | - Nhận xét ngữ điệu: Nhấn nhá Pitch accent, âm ngắt (っ), trường âm (ー) |  |  |                 |  |
|  | - Sửa ngữ pháp & Diễn đạt: Câu đối đáp mượt mà hơn của người bản xứ      |  |  +-----------------+  |
|  | - Lời thoại tiếp theo của AI: Chuẩn bị cho lượt nghe tiếp theo           |  |  | QUICK FLASHCARD |  |
|  +-------------------------------------------------------------------------+  |  | (Bôi đen là lưu)|  |
+-------------------------------------------------------------------------------+-----------------------+
```

---

## 5. 🔄 Chu Trình Dữ Liệu & API Contract (Data Flow)

### 5.1. Khởi tạo tình huống: `POST /api/chat/start`
* **Request:** `{}`
* **Response:**
```json
{
  "scenario": {
    "title": "コンビニでのお会計 (Thanh toán tại cửa hàng tiện lợi)",
    "aiRole": "店員 (Nhân viên thu ngân)",
    "userRole": "客 (Khách mua hàng)",
    "description": "Bạn vừa đặt cơm hộp bento và nước ngọt lên quầy tính tiền."
  },
  "firstTurn": {
    "aiSentence": "いらっしゃいませ。温めますか？",
    "hiragana": "いらっしゃいませ。あたためますか？",
    "furigana": [
      { "text": "いらっしゃいませ。" },
      { "text": "温", "furigana": "あたた" },
      { "text": "めますか？" }
    ],
    "vietnamese": "Xin chào quý khách. Quý khách có muốn hâm nóng không ạ?",
    "audioUrl": "/api/audio/sample_001.mp3"
  }
}
```

### 5.2. Người học nộp lượt nói: `POST /api/chat/respond`
* **Request (FormData):**
  - `audio`: File ghi âm `.webm` / `.wav` từ `MediaRecorder`.
  - `scenarioId`: ID của phiên hội thoại hiện tại.
  - `history`: Mảng các lượt thoại trước đó.
* **Gemini Pro Prompting:**
  - Nhập file âm thanh vào ngữ cảnh đa phương thức.
  - Phân tích phát âm, ngữ điệu, ngữ pháp.
  - Sinh câu đối đáp tiếp theo phù hợp logic tình huống.
* **Response:**
```json
{
  "evaluation": {
    "transcription": "おねがいします",
    "pronunciationScore": 92,
    "intonationFeedback": "Phát âm từ 'お願いします' rất rõ ràng. Ngữ điệu tự nhiên, lưu ý nhẹ âm cuối để nghe khiêm nhường hơn.",
    "grammarFeedback": "Dùng 'お願いします' rất chuẩn trong ngữ cảnh này. Nếu muốn tự nhiên như người Nhật có thể nói 'はい、お願いします' hoặc '大丈夫です'.",
    "naturalSuggestion": "はい、温めてください (Vâng, làm nóng giúp tôi với ạ)"
  },
  "nextTurn": {
    "aiSentence": "かしこまりました。少々お待ちください。スプーンはおつけしますか？",
    "hiragana": "かしこまりました。しょうしょうおまちください。すぷーんはおつけしますか？",
    "furigana": [...],
    "vietnamese": "Tôi hiểu rồi ạ. Xin quý khách đợi một chút. Quý khách có lấy thìa không ạ?",
    "audioUrl": "/api/audio/turn_002.mp3"
  }
}
```

---

## 6. 🛡️ Xử Lý Lỗi & Tình Huống Biên (Edge Cases)
1. **Gõ Dictation dưới 80% liên tiếp:** Sau 3 lần gõ không qua mốc 80%, hiển thị nút gợi ý: *"Xem phiên âm & Furigana"* hoặc *"Mở khóa hỗ trợ"* để tránh gây ức chế đứt đoạn.
2. **Audio rỗng hoặc quá ngắn:** Kiểm tra dung lượng và biên độ âm lượng phía Client; nếu người dùng vô tình bấm thả mic dưới 0.5s thì cảnh báo: *"Chưa thu được giọng nói, bạn hãy giữ mic và nói to hơn nhé!"* trước khi gửi lên API.
3. **Mạng gián đoạn hoặc Gemini API bận:** Giữ nguyên file ghi âm trong bộ nhớ đệm, hiển thị nút *"Thử gửi lại"* để người học không phải nói lại.
4. **Quyền truy cập Micro:** Bắt sự kiện `NotAllowedError` từ `navigator.mediaDevices.getUserMedia` để hiển thị popup chỉ dẫn mở quyền micro trên trình duyệt.

---

## 7. ⭐ Các Tiện Ích Đề Xuất Đi Kèm (Value-added Features)
1. **Quick Flashcard khi bôi đen (Kế thừa từ `luyen_go_phu_de`):** Bôi đen từ mới trong câu AI hoặc nhận xét của Gemini để tự tra nghĩa và lưu vào sổ tay ôn tập.
2. **Thanh chỉnh tốc độ giọng AI (0.75x, 1.0x):** Giúp nghe bắt âm dễ dàng hơn ở bước Dictation.
3. **Gợi ý phản xạ (Response Idea Hints):** Mớm ý tưởng đối đáp khi người học bị "đóng băng" chưa biết nên nói gì.
4. **Báo cáo tổng kết buổi học (Debrief Summary):** Tóm tắt điểm phát âm trung bình, danh sách từ vựng đã dùng và câu nói hay sau khi kết thúc 1 tình huống.
