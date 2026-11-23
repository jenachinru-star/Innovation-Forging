const BASE = process.env.SEEDREAM_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = process.env.SEEDREAM_MODEL || '';
const KEY = process.env.SEEDREAM_API_KEY || '';

export const STYLE_PROMPT = '水彩插画风格，暖色调，半身肖像，简化背景，柔和线条，戏剧海报质感';

export async function generateCharacterImage(description, { fetchImpl = fetch } = {}) {
  const prompt = `人物肖像：${description}。${STYLE_PROMPT}，非写实，不要照片级真人脸。`;
  const res = await fetchImpl(`${BASE}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size: '1024x1024', response_format: 'url' }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Seedream API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
  if (!url) throw new Error('Seedream 未返回图片');
  return url;
}
