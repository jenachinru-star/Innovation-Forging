import { normalizeScriptData } from '@director/shared';
import { chatComplete } from './deepseekClient.js';

export async function withRetry(fn, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn(i);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

const GENERATE_SYSTEM = [
  '你是一位资深戏剧编剧，帮助编导把零散素材整理成规范剧本。',
  '规则：',
  '1) 如果用户素材信息严重不足、无法展开成一场戏，请只回复一行，以 "NEED_MORE_INFO:" 开头，后面用一句自然的话反问缺失的关键信息（如人物名字、关系、发生了什么），不要编造。',
  '2) 否则，直接输出规范剧本文本：先写分场大纲（每场的核心人物与事件），再逐场展开【场次标题/场景地点/出场人物/舞台提示/人物对白】。',
  '3) 全文只输出剧本内容本身，不要额外解释。',
].join('\n');

export async function generateScript(material, { chat = chatComplete } = {}) {
  const messages = [
    { role: 'system', content: GENERATE_SYSTEM },
    { role: 'user', content: String(material || '') },
  ];
  const content = await withRetry(() => chat(messages), 2);
  const trimmed = content.trim();

  if (trimmed.startsWith('NEED_MORE_INFO:')) {
    const question = trimmed.slice('NEED_MORE_INFO:'.length).trim();
    return { needMoreInfo: true, question };
  }
  return { needMoreInfo: false, scriptText: trimmed };
}

export function safeParseScriptData(text) {
  if (typeof text !== 'string') return null;
  try {
    return normalizeScriptData(JSON.parse(text));
  } catch {
    /* fallthrough */
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return normalizeScriptData(JSON.parse(text.slice(start, end + 1)));
    } catch {
      /* fallthrough */
    }
  }
  return null;
}
