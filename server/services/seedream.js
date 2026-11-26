// 图片生成服务：OpenAI 兼容 /images/generations，接入 OpenAI Next 中转站
export const STYLE_PROMPT = '水彩插画风格，暖色调，半身肖像，简化背景，柔和线条，戏剧海报质感';

function readConfig() {
  return {
    base: process.env.OPENAI_NEXT_BASE_URL || 'https://api.openai-next.com/v1',
    model: process.env.IMAGE_MODEL || 'doubao-seedream-5-5-261028',
    key: process.env.OPENAI_NEXT_API_KEY || '',
  };
}

// 底层：调用图片生成接口，返回图片 URL
async function callImage(prompt, { fetchImpl = fetch, size = '1024x1024' } = {}) {
  const { base, model, key } = readConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  let res;
  try {
    res = await fetchImpl(`${base}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, size, response_format: 'url' }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('图片生成请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`图片生成 API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
  if (!url) throw new Error('图片生成未返回图片');
  return url;
}

export async function generateCharacterImage(
  description,
  { fetchImpl = fetch, stylePrompt = '' } = {}
) {
  const prompt = `人物定妆参考：${description}。${stylePrompt || STYLE_PROMPT}。角色外观必须保持连续，避免无依据的表情、服装和道具变化。`;
  return callImage(prompt, { fetchImpl, size: '1024x1024' });
}

// 通用视觉画面：直接接收已构造好的画面描述
export async function generateVisualImage(
  prompt,
  { fetchImpl = fetch, size = '1024x1024' } = {}
) {
  const fullPrompt = `${prompt}。保持全片视觉风格统一、光线方向一致，避免无来源的装饰元素。`;
  return callImage(fullPrompt, { fetchImpl, size });
}
