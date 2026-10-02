// server/services/storageService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const STUDY_HISTORY_FILE = path.join(DATA_DIR, 'study_history.json');
const FLASHCARDS_FILE = path.join(DATA_DIR, 'flashcards.json');

// Khởi tạo thư mục data trên phần cứng nếu chưa có
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Đọc file JSON an toàn
function readJsonFile(filePath, defaultValue = []) {
  ensureDataDir();
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error(`[STORAGE READ ERROR] ${filePath}:`, err.message);
    return defaultValue;
  }
}

// Ghi file JSON an toàn (Atomic Write)
function writeJsonFile(filePath, data) {
  ensureDataDir();
  const tempPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, jsonStr, 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[STORAGE WRITE ERROR] ${filePath}:`, err.message);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_) {}
    return false;
  }
}

// ==================== 1. QUẢN LÝ KHO LỊCH SỬ HỘI THOẠI (STUDY HISTORY) ====================

/**
 * Lấy toàn bộ danh sách các chủ đề đã học từ ổ cứng
 */
export function getAllStudySessions() {
  return readJsonFile(STUDY_HISTORY_FILE, []);
}

/**
 * Lưu hoặc cập nhật một phiên học vào ổ cứng
 */
export function saveStudySession(sessionRecord) {
  if (!sessionRecord || !sessionRecord.id) return false;
  const sessions = getAllStudySessions();

  // Kiểm tra nếu đã tồn tại session cùng title hoặc id, ta cập nhật bản mới nhất
  const filtered = sessions.filter(
    (s) => s.id !== sessionRecord.id && s.scenario?.title !== sessionRecord.scenario?.title
  );
  const updated = [sessionRecord, ...filtered];

  const success = writeJsonFile(STUDY_HISTORY_FILE, updated);
  if (success) {
    console.log(`💾 [DISK PERSIST] Đã lưu phiên học "${sessionRecord.scenario?.title}" xuống phần cứng.`);
  }
  return success;
}

/**
 * Xóa một phiên học khỏi ổ cứng theo ID
 */
export function deleteStudySession(sessionId) {
  const sessions = getAllStudySessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  return writeJsonFile(STUDY_HISTORY_FILE, filtered);
}

/**
 * Xóa toàn bộ kho lịch sử trên ổ cứng
 */
export function clearAllStudySessions() {
  return writeJsonFile(STUDY_HISTORY_FILE, []);
}

// ==================== 2. QUẢN LÝ SỔ TỪ VỰNG FLASHCARD (FLASHCARDS) ====================

/**
 * Lấy danh sách toàn bộ Flashcard từ ổ cứng
 */
export function getAllFlashcards() {
  return readJsonFile(FLASHCARDS_FILE, []);
}

/**
 * Lưu danh sách Flashcard vào ổ cứng
 */
export function saveAllFlashcards(flashcards) {
  if (!Array.isArray(flashcards)) return false;
  return writeJsonFile(FLASHCARDS_FILE, flashcards);
}
