function readConfig() {
  return {
    base: process.env.SEEDANCE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.SEEDANCE_MODEL || '',
    key: process.env.SEEDANCE_API_KEY || '',
  };
}

const DEFAULT_RATIO = '16:9';
const DEFAULT_DURATION = 5;

// 创建视频生成任务：POST /contents/generations/tasks，返回任务 ID
export async function createVideoTask(
  { prompt, ratio = DEFAULT_RATIO, duration = DEFAULT_DURATION, imageUrl = '' },
  { fetchImpl = fetch } = {}
) {
  if (!prompt || !String(prompt).trim()) throw new Error('缺少镜头描述');
  const { base, model, key } = readConfig();

  const content = [{ type: 'text', text: String(prompt).trim() }];
  if (imageUrl) {
    content.push({ type: 'image_url', image_url: { url: imageUrl } });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetchImpl(`${base}/contents/generations/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        content,
        ratio,
        duration: Number(duration) || DEFAULT_DURATION,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('Seedance 请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Seedance API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data?.id) throw new Error('Seedance 未返回任务 ID');
  return { id: data.id, status: data.status || 'queued' };
}

// 查询视频生成任务：GET /contents/generations/tasks/{id}
export async function getVideoTask(taskId, { fetchImpl = fetch } = {}) {
  if (!taskId) throw new Error('缺少任务 ID');
  const { base, key } = readConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetchImpl(`${base}/contents/generations/tasks/${taskId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('Seedance 请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Seedance API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    status: data.status || 'unknown',
    videoUrl: data?.content?.video_url || '',
    error: data?.error ? String(data.error) : '',
  };
}
