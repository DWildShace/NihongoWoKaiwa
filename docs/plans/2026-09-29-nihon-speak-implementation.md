# 🎙️ NihonSpeak (日本語会話) Implementation Plan

> **For AI Assistant:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fullstack web application for interactive Japanese speaking & dictation practice with Gemini Pro Multimodal Audio, featuring a 2-step loop: Dictation (≥80% match) ➔ Speaking response with AI pronunciation & pitch accent coaching.

**Architecture:** Fullstack Client-Server model. Frontend built with React 19, Vite, and TailwindCSS v4 with a 75%-25% 2-column layout. Backend built with Node.js Express 4, Kuromoji morphological analyzer for Hiragana normalization, and Google Gen AI SDK for multimodal audio evaluation and dialogue generation.

**Tech Stack:** React 19, Vite 6, TailwindCSS v4, Wanakana, Lucide React, Node.js, Express 4, Kuromoji, `@google/genai` (or `@google/generative-ai`), dotenv, cors, multer.

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/package.json`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/vite.config.js`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/index.html`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/index.css`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/main.jsx`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/.env.example`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/start.bat`

**Step 1: Create `package.json`**
Define all dependencies including React 19, Vite, Tailwind v4, Wanakana, Lucide-react, Express, Kuromoji, Multer, Concurrently.

**Step 2: Create `vite.config.js`**
Configure Vite with React plugin, TailwindCSS v4 plugin, and proxy `/api` requests to `http://localhost:5001`.

**Step 3: Setup `index.html` and `src/index.css`**
Set up modern Google Fonts (Noto Sans JP, Inter), Japanese text typography classes, and TailwindCSS `@import "tailwindcss";`.

**Step 4: Create `start.bat`**
Windows batch script to launch both frontend and backend concurrently with colored logs.

---

### Task 2: Backend Language & Tokenizer Service (`server/services/kuromojiService.js`)

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/server/services/kuromojiService.js`
- Test: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/server/tests/kuromojiTest.js`

**Step 1: Implement Kuromoji Tokenizer Service**
- Initialize Kuromoji analyzer singleton.
- Function `toNormalizedHiragana(text)`: Converts Kanji/Katakana to Hiragana, strips punctuation, whitespace, and symbols.
- Function `extractFurigana(text)`: Returns structured tokens with base Kanji and Furigana annotations for rich UI display.
- Function `computeSimilarity(inputStr, targetStr)`: Levenshtein-based similarity percentage (0-100%).

**Step 2: Verify Kuromoji Service**
Run test script to verify Kanji conversion (e.g. `何かお探しですか？` ➔ `なにかおさがしですか`).

---

### Task 3: Backend Gemini Pro Multimodal Integration (`server/services/geminiService.js`)

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/server/services/geminiService.js`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/server/routes/chat.js`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/server/index.js`

**Step 1: Implement `generateRandomScenario()`**
- Prompt Gemini Pro to generate an authentic Japanese communication scenario with:
  - Scenario Title, Description, AI Role, User Role.
  - First opening line in Japanese, Vietnamese translation, and Hiragana reading.
- Synthesize natural Japanese audio for the opening line.

**Step 2: Implement `evaluateUserAudioAndRespond(audioBuffer, mimeType, history, scenario)`**
- Send the recorded audio buffer to Gemini Pro Multimodal.
- System prompt acts as an elite Japanese phonetics & conversation coach.
- Extracts:
  - `transcription`: Exact Japanese words spoken by user.
  - `pronunciationScore`: Score (0-100).
  - `intonationFeedback`: Observations on pitch accent, small tsu (っ), long vowels (ー).
  - `grammarFeedback`: Grammar correctness and natural native alternatives in Vietnamese.
  - `aiNextSentence`: The next natural reply in the roleplay.
- Synthesize audio for `aiNextSentence`.

**Step 3: Setup Express Server & Endpoints**
- `POST /api/chat/start`: Starts a new random scenario.
- `POST /api/chat/respond`: Handles multipart audio upload from user, calls Gemini, returns evaluation + next turn.
- `POST /api/tokenize`: Tokenizes Japanese text for furigana and Hiragana.

---

### Task 4: Frontend Audio Recorder & Utility Modules

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/utils/audioRecorder.js`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/utils/similarity.js`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/utils/soundEffects.js`

**Step 1: Implement `audioRecorder.js`**
- Safe microphone permission request via `navigator.mediaDevices.getUserMedia`.
- Audio recording using `MediaRecorder` with `audio/webm;codecs=opus` fallback.
- Audio volume analyser for real-time visual waveform feedback.
- Minimum duration / RMS volume guard against empty recordings.

**Step 2: Implement `similarity.js`**
- Client-side Hiragana Levenshtein distance matcher for zero-latency real-time score meter updates as user types.

**Step 3: Implement `soundEffects.js`**
- Web Audio API synthesized sound cues (unlock chime when reaching ≥80%, start record beep, finish evaluation sound).

---

### Task 5: Frontend Layout & Navigation (`src/components/Header.jsx`, `src/App.jsx`)

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/Header.jsx`
- Modify: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/App.jsx`

**Step 1: Implement `Header.jsx`**
- App branding: NihonSpeak (日本語会話) with Japanese flag badge.
- Backend & Gemini connection status indicator (green pulse).
- Quick access button to "Sổ tay Flashcard" modal.

**Step 2: Implement 75% - 25% Grid Layout in `App.jsx`**
- Left Column (75% width):
  - Row 1: Interactive Drill Stage (Dictation & Speaking).
  - Row 2: AI Coaching & Evaluation Stage.
- Right Column (25% width):
  - Side Panel: Scenario Details & Conversation History Timeline.

---

### Task 6: Frontend Main Stage - Row 1: Dictation & Speaking (`src/components/DictationSpeakingCard.jsx`)

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/DictationSpeakingCard.jsx`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/AudioPlayerWidget.jsx`

**Step 1: Build Scenario Banner**
- Scenario context header with lively badges, roles, and prominent "🎲 Random ngữ cảnh mới" button.

**Step 2: Build Audio Player Widget**
- Visual animated soundwave bars when playing.
- Replay button, audio scrub, and speed toggles (0.75x, 1.0x).

**Step 3: Build Dictation Input with Wanakana**
- Real-time Romaji ➔ Hiragana input binding.
- Animated Circular / Linear Progress Bar showing % match (0-100%).
- Changes color from amber to emerald green when reaching ≥80%.
- "💡 Gợi ý âm đọc" button (shows Furigana hint if user is stuck).

**Step 4: Build Speaking Section**
- Locked / Unlocked state transition with smooth slide & glow animation.
- Giant interactive Microphone button:
  - Hold/Click to record.
  - Pulsing soundwave ring during voice capture.
- "Gợi ý cách trả lời" button to display 2-3 sample response ideas.

---

### Task 7: Frontend Main Stage - Row 2: AI Coaching & Evaluation (`src/components/AICoachingCard.jsx`)

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/AICoachingCard.jsx`

**Step 1: Build Pronunciation & Speech Analysis Section**
- Badge showing user's transcribed sentence with Furigana.
- Pronunciation Score badge (e.g. 94/100 🌟).
- Detailed intonation & pitch accent coach comments (nhận xét âm ngắt, trường âm, ngữ điệu câu hỏi).

**Step 2: Build Grammar & Natural Phrasing Section**
- Sửa lỗi ngữ pháp và gợi ý câu nói tự nhiên của người Nhật bản xứ (bằng tiếng Việt ngắn gọn).
- "Tiếp tục câu tiếp theo" button / auto-trigger for the next dialogue turn.

---

### Task 8: Frontend Side Panel - Column 2 (25%): Timeline & Flashcards

**Files:**
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/TimelineSidePanel.jsx`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/QuickFlashcardBar.jsx`
- Create: `e:/________thuMucHoc/Ni_Hon/luyen_noi_giao_tiep/src/components/FlashcardModal.jsx`

**Step 1: Build TimelineSidePanel**
- Scrollable chat bubble history representing the entire conversation flow.
- Click any past AI or User bubble to replay its audio.

**Step 2: Port Quick Flashcard & Flashcard Modal**
- Select/highlight any Japanese text anywhere on screen ➔ floating Quick Flashcard bar appears.
- Auto-translates to Vietnamese, displays Furigana, and allows 1-click save to LocalStorage.
- Export to Anki (.txt) and Quizlet formats.

---

### Task 9: End-to-End Testing & Polish

**Step 1: Test Full Happy Path Loop**
1. Click "Random ngữ cảnh".
2. Listen to AI Japanese audio.
3. Type dictation until score >= 80%.
4. Unlock mic, record user voice response.
5. Receive Gemini's pronunciation score, pitch accent feedback, and next dialogue.
6. Verify smooth continuation into next turn.

**Step 2: Test Edge Cases**
- Mic permission denied handling.
- Silence detection / short audio alert.
- 3 failed dictation attempts hint unlock.
- Network retry handling.
