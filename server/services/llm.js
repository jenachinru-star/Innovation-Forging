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

const PARSE_SYSTEM = [
  '你是戏剧结构分析助手。请把用户提供的剧本解析为严格 JSON，且只输出 JSON。',
  'JSON 结构（字段名必须完全一致）：',
  '{',
  '  "summary": "整部剧本一句话简介",',
  '  "scenes": [{ "sceneNumber": 1, "title": "第一场", "location": "地点",',
  '              "characters": ["出场人物"], "props": ["道具"],',
  '              "summary": "本场剧情摘要", "estimatedMinutes": 5 }],',
  '  "characters": [{ "name": "人物名", "description": "人物简介" }],',
  '  "relationships": [{ "from": "人物A", "to": "人物B",',
  '                     "relation": "关系描述", "needsReview": false }]',
  '}',
  '要求：estimatedMinutes 为估算的演出分钟数（整数）。',
  'relationships 尽量覆盖主要人物关系；若对某条关系判断把握不足，把其 needsReview 设为 true。',
  '无法判断的关系不要编造；没有任何关系时返回空数组。',
].join('\n');

export async function parseScript(scriptText, { chat = chatComplete } = {}) {
  const baseMessages = [
    { role: 'system', content: PARSE_SYSTEM },
    { role: 'user', content: String(scriptText || '') },
  ];
  const strongMessages = [
    { role: 'system', content: `${PARSE_SYSTEM}\n只输出纯 JSON，不要任何解释文字，不要代码块标记。` },
    { role: 'user', content: String(scriptText || '') },
  ];

  // 有界尝试：最多 4 次上游调用（正常情况第 1 次即成功）
  const attempts = [
    () => chat(baseMessages, { jsonMode: true }),
    () => chat(baseMessages),
    () => chat(strongMessages, { jsonMode: true }),
    () => chat(strongMessages),
  ];

  let lastErr;
  for (const attempt of attempts) {
    let content;
    try {
      content = await attempt();
    } catch (e) {
      lastErr = e;
      continue;
    }
    const parsed = safeParseScriptData(content);
    if (parsed) return parsed;
  }

  const suffix = lastErr ? `（${lastErr.message}）` : '';
  throw new Error(`解析失败：AI 输出无法解析为结构化数据${suffix}`);
}
