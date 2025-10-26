// src/api/base44Client.js
// 独立版 Base44 接口封装

import axios from "axios";

// 这是你的 Base44 API Key（用你自己的 token 替换）
const BASE44_API_KEY = "你的 Base44 Token";
const BASE44_API_URL = "https://api.base44.app/v1";

// ✅ 保留旧系统引用 — 给 entities.js 用
export const base44 = axios.create({
  baseURL: BASE44_API_URL,
  headers: {
    Authorization: `Bearer ${BASE44_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// ✅ 也提供新的 AI 调用函数
export async function generateAIEvent(prompt) {
  try {
    const res = await base44.post("/ai/generate", { prompt });
    return res.data;
  } catch (err) {
    console.error("Base44 AI 调用失败:", err);
    return { error: err.message };
  }
}
