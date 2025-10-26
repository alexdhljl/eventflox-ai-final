// src/api/base44Client.js
// 独立版 — 保留 Base44 AI 能力，移除登录依赖

import axios from "axios";

const BASE44_API_URL = "https://api.base44.app/v1"; // 根据你的API版本调整
const BASE44_API_KEY = "你的 Base44 token"; // ⚠️ 用你现有 Base44 的 token 替换

export async function generateAIEvent(prompt) {
  try {
    const res = await axios.post(
      `${BASE44_API_URL}/ai/generate`,
      { prompt },
      {
        headers: {
          Authorization: `Bearer ${BASE44_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Base44 AI 调用失败:", err);
    return { error: err.message };
  }
}
