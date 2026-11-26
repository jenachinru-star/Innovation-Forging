import { apiRequest } from './client.js';

/**
 * 调用 AI 助手。
 * @param {Array<{role:string, content:string}>} messages 历史消息
 * @param {object} context 作品上下文
 * @returns {Promise<{content:string, images:Array<{url:string, prompt:string}>}>}
 */
export function chatAssistant(messages, context) {
  return apiRequest('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, context }),
  });
}
