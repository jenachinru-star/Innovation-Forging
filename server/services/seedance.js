// 视频生成服务：Seedance (Ark) 异步任务，经 OpenAI Next 中转站代理
// 提交 POST  /seedance/api/v3/contents/generations/tasks
// 轮询 GET   /seedance/api/v3/contents/generations/tasks/{id}
function readConfig() {
  const base = process.env.OPENAI_NEXT_BASE_URL || 'https://api.openai-next.com/v1';
  // 中转站业务路径挂在 /seedance/api/v3 下，与 OpenAI 风格的 /v1 前缀不同，这里取协议+域名
  const origin = base.replace(/\/v1\/?$/, '');
  return {
    origin,
    model: process.env.VIDEO_MODEL || 'doubao-seedance-2-5-flash-261115',
    key: process.env.OPENAI_NEXT_API_KEY || '',
    resolution: process.env.VIDEO_RESOLUTION || '720p',
    generateAudio: process.env.VIDEO_GENERATE_AUDIO !== 'false',
  };
}

const TASK_PATH = '/seedance/api/v3/contents/generations/tasks';
const DEFAULT_RATIO = '16:9';
const DEFAULT_DURATION = 5;
const MIN_DURATION = 4;
const MAX_DURATION = 15;

// 创建视频生成任务：返回任务 ID
export async function createVideoTask(
  { prompt, ratio = DEFAULT_RATIO, duration = DEFAULT_DURATION, imageUrl = '' },
  { fetchImpl = fetch } = {}
) {
  if (!prompt || !String(prompt).trim()) throw new Error('缺少镜头描述');
  const { origin, model, key, resolution, generateAudio } = readConfig();

  const content = [{ type: 'text', text: String(prompt).trim() }];
  if (imageUrl) {
    content.push({ type: 'image_url', image_url: { url: imageUrl } });
  }

  const seconds = Number(duration) || DEFAULT_DURATION;
  const clampedDuration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, seconds));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetchImpl(`${origin}${TASK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        content,
        ratio,
        resolution,
        duration: clampedDuration,
        generate_audio: generateAudio,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('视频任务创建超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`视频生成 API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data?.id) throw new Error('视频生成未返回任务 ID');
  return { id: data.id, status: data.status || 'queued' };
}

// 查询视频生成任务
export async function getVideoTask(taskId, { fetchImpl = fetch } = {}) {
  if (!taskId) throw new Error('缺少任务 ID');
  const { origin, key } = readConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetchImpl(`${origin}${TASK_PATH}/${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('视频任务查询超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`视频生成 API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawError = data?.error;
  let error = '';
  if (rawError) {
    if (typeof rawError === 'string') error = rawError;
    else error = rawError.message || rawError.code || JSON.stringify(rawError);
  }
  return {
    id: data.id,
    status: data.status || 'unknown',
    videoUrl: data?.content?.video_url || '',
    error,
  };
}
