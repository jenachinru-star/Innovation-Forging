export async function chatComplete(messages, { jsonMode = false } = {}) {
  const BASE = process.env.DEEPSEEK_BASE_URL || 'https://sub2.denglink.cn/v1';
  const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-flash';
  const KEY = process.env.DEEPSEEK_API_KEY || '';

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
    if (e?.name === 'AbortError') throw new Error('DeepSeek 请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`DeepSeek API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('DeepSeek 返回内容为空');
  return content;
}
