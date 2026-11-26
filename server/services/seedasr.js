// 语音转写服务：OpenAI 兼容 /audio/transcriptions（Whisper），multipart 上传文件字节
function readConfig() {
  return {
    base: process.env.OPENAI_NEXT_BASE_URL || 'https://api.openai-next.com/v1',
    key: process.env.OPENAI_NEXT_API_KEY || '',
    model: process.env.ASR_MODEL || 'whisper-1',
  };
}

function normalizeFormat(format) {
  const f = String(format || '').toLowerCase();
  if (f.includes('webm')) return { ext: 'webm', mime: 'audio/webm' };
  if (f.includes('mpeg') || f.includes('mp3')) return { ext: 'mp3', mime: 'audio/mpeg' };
  if (f.includes('mp4') || f.includes('m4a')) return { ext: 'm4a', mime: 'audio/mp4' };
  if (f.includes('aac')) return { ext: 'aac', mime: 'audio/aac' };
  if (f.includes('ogg')) return { ext: 'ogg', mime: 'audio/ogg' };
  if (f.includes('wav') || f.includes('wave')) return { ext: 'wav', mime: 'audio/wav' };
  return { ext: 'webm', mime: 'audio/webm' };
}

export async function transcribeAudio(
  { audioData = '', audioUrl = '', format = 'webm' },
  { fetchImpl = fetch } = {}
) {
  const { base, key, model } = readConfig();
  if (!key) throw new Error('未配置转写凭证');
  if (!audioData && !audioUrl) throw new Error('缺少音频数据');

  let buffer;
  let fileMeta;
  if (audioData) {
    buffer = Buffer.from(audioData, 'base64');
    fileMeta = normalizeFormat(format);
  } else {
    const upstream = await fetchImpl(audioUrl);
    if (!upstream.ok) throw new Error('音频下载失败');
    buffer = Buffer.from(await upstream.arrayBuffer());
    fileMeta = { ext: 'wav', mime: 'audio/wav' };
  }

  const form = new FormData();
  form.append('model', model);
  form.append('file', new Blob([buffer], { type: fileMeta.mime }), `recording.${fileMeta.ext}`);

  const res = await fetchImpl(`${base}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`语音转写 API ${res.status}: ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.text;
  if (typeof text !== 'string') throw new Error('语音转写未返回文本');
  return text;
}
