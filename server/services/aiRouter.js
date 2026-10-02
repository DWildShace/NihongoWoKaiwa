// server/services/aiRouter.js
import * as geminiService from './geminiService.js';
import * as deepseekService from './deepseekService.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Lấy nhà cung cấp AI ưu tiên (mặc định: 'gemini')
 */
export function getPreferredProvider(reqProvider) {
  if (reqProvider && ['gemini', 'deepseek'].includes(reqProvider.toLowerCase())) {
    return reqProvider.toLowerCase();
  }
  const envProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  return envProvider === 'deepseek' ? 'deepseek' : 'gemini';
}

/**
 * Trả về trạng thái các nhà cung cấp AI đang khả dụng
 */
export function getAvailableProviders() {
  const geminiAvailable = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const deepseekAvailable = deepseekService.isDeepSeekConfigured();
  const current = getPreferredProvider();

  return {
    preferred: current,
    gemini: {
      available: geminiAvailable,
      activeModel: 'gemini-3.5-flash-lite',
    },
    deepseek: {
      available: deepseekAvailable,
      activeModel: 'deepseek-chat',
    },
  };
}

/**
 * [DISPATCHER: PHẢN XẠ NHANH] Lượt đối đáp phản xạ với cơ chế Failover thông minh
 */
export async function generateFastNextTurn(params) {
  const provider = getPreferredProvider(params.provider);

  if (provider === 'deepseek' && deepseekService.isDeepSeekConfigured()) {
    try {
      return await deepseekService.generateDeepSeekFastNextTurn(params);
    } catch (err) {
      console.warn('[AI-ROUTER] DeepSeek thất bại, tự động chuyển sang Gemini:', err.message);
      return await geminiService.generateFastNextTurn(params);
    }
  }

  // Mặc định gọi Gemini
  try {
    return await geminiService.generateFastNextTurn(params);
  } catch (err) {
    if (deepseekService.isDeepSeekConfigured()) {
      console.warn('[AI-ROUTER] Gemini thất bại, tự động chuyển sang DeepSeek:', err.message);
      return await deepseekService.generateDeepSeekFastNextTurn(params);
    }
    throw err;
  }
}

/**
 * [DISPATCHER: TỔNG KẾT BÀI HỌC 10 LƯỢT] Đánh giá toàn diện
 */
export async function generateSessionComprehensiveReview(params) {
  const provider = getPreferredProvider(params.provider);

  if (provider === 'deepseek' && deepseekService.isDeepSeekConfigured()) {
    try {
      return await deepseekService.generateDeepSeekSessionReview(params);
    } catch (err) {
      console.warn('[AI-ROUTER] DeepSeek review thất bại, chuyển sang Gemini:', err.message);
      return await geminiService.generateSessionComprehensiveReview(params);
    }
  }

  // Mặc định gọi Gemini
  try {
    return await geminiService.generateSessionComprehensiveReview(params);
  } catch (err) {
    if (deepseekService.isDeepSeekConfigured()) {
      console.warn('[AI-ROUTER] Gemini review thất bại, chuyển sang DeepSeek:', err.message);
      return await deepseekService.generateDeepSeekSessionReview(params);
    }
    throw err;
  }
}

/**
 * [DISPATCHER: KHỞI TẠO TÌNH HUỐNG] Tạo ngữ cảnh ngẫu nhiên
 */
export async function generateRandomScenario(params) {
  const provider = getPreferredProvider(params.provider);

  if (provider === 'deepseek' && deepseekService.isDeepSeekConfigured()) {
    try {
      return await deepseekService.generateDeepSeekRandomScenario(params);
    } catch (err) {
      console.warn('[AI-ROUTER] DeepSeek scenario thất bại, chuyển sang Gemini:', err.message);
      return await geminiService.generateRandomScenario(params);
    }
  }

  // Mặc định gọi Gemini
  try {
    return await geminiService.generateRandomScenario(params);
  } catch (err) {
    if (deepseekService.isDeepSeekConfigured()) {
      console.warn('[AI-ROUTER] Gemini scenario thất bại, chuyển sang DeepSeek:', err.message);
      return await deepseekService.generateDeepSeekRandomScenario(params);
    }
    throw err;
  }
}
