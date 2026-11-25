import { chatComplete } from './deepseekClient.js';

const SUMMARY_SYSTEM = [
  '你是资深戏剧编导助理，负责把会议或讨论内容整理成结构化纪要。只输出严格 JSON，不要任何解释。',
  'JSON 字段名必须完全一致：',
  '{',
  ' "overview": "一段话概述本次讨论的核心内容",',
  ' "decisions": ["已经确定的结论或决定"],',
  ' "todos": ["需要执行的待办事项，尽量包含责任人与时间"],',
  ' "changes": ["对剧本、场次、人物、部门需求等的变更点"],',
  ' "questions": ["尚未解决、待确认的问题"]',
  '}',
  '要求：只依据原文，不要编造；没有对应内容时返回空数组；每条用简洁的中文短句。',
].join('\n');

function safeParseJson(text) {
  if (typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    /* fallthrough */
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fallthrough */
    }
  }
  return null;
}

function normalizeSummary(value) {
  const source = value && typeof value === 'object' ? value : {};
  const asList = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  return {
    overview: typeof source.overview === 'string' ? source.overview : '',
    decisions: asList(source.decisions),
    todos: asList(source.todos),
    changes: asList(source.changes),
    questions: asList(source.questions),
  };
}

export async function summarizeDiscussion(text, { chat = chatComplete } = {}) {
  const content = String(text || '').trim();
  if (!content) throw new Error('讨论内容为空');

  const messages = [
    { role: 'system', content: SUMMARY_SYSTEM },
    { role: 'user', content },
  ];
  const attempts = [
    () => chat(messages, { jsonMode: true }),
    () => chat(messages),
  ];

  let lastErr;
  for (const attempt of attempts) {
    let reply;
    try {
      reply = await attempt();
    } catch (e) {
      lastErr = e;
      continue;
    }
    const parsed = safeParseJson(reply);
    if (parsed) return normalizeSummary(parsed);
  }

  throw new Error(`纪要生成失败：${lastErr?.message || 'AI 输出无法解析'}`);
}
