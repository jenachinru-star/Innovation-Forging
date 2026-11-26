// 对话模型客户端：OpenAI 兼容 /chat/completions，接入 OpenAI Next 中转站
export async function chatComplete(messages, { jsonMode = false } = {}) {
  const BASE = process.env.OPENAI_NEXT_BASE_URL || 'https://api.openai-next.com/v1';
  const MODEL = process.env.CHAT_MODEL || 'gpt-5.4-mini';
  const KEY = process.env.OPENAI_NEXT_API_KEY || '';

  const body = { model: MODEL, messages, temperature: 0.7 };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let res;
  try {
    res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('对话模型请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`对话模型 API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('对话模型返回内容为空');
  return content;
}
