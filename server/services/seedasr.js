function readConfig() {
  return {
    base: process.env.SEEDASR_BASE_URL || 'https://openspeech.bytedance.com',
    key: process.env.SEEDASR_API_KEY || '',
    resourceId: process.env.SEEDASR_RESOURCE_ID || 'volc.seedasr.auc',
  };
}

function buildHeaders(key, resourceId, requestId) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'X-Api-Resource-Id': resourceId,
    'X-Api-Request-Id': requestId,
    'X-Api-Sequence': '-1',
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 录音文件识别：submit 提交 + query 轮询，返回识别文本
export async function transcribeAudio(
  { audioData = '', audioUrl = '', format = 'webm' },
  { fetchImpl = fetch, pollInterval = 2000, maxPolls = 30 } = {}
) {
  const { base, key, resourceId } = readConfig();
  if (!key) throw new Error('未配置 SeedASR 凭证');
  if (!audioData && !audioUrl) throw new Error('缺少音频数据');

  const requestId = crypto.randomUUID();
  const headers = buildHeaders(key, resourceId, requestId);

  const audio = { format, codec: 'raw', rate: 16000, bits: 16, channel: 1 };
  if (audioData) audio.data = audioData;
  else audio.url = audioUrl;

  const submitBody = {
    user: { uid: 'kaipai' },
    audio,
    request: {
      model_name: 'bigmodel',
      enable_itn: true,
      enable_punc: true,
      show_utterances: false,
    },
  };

  const submitRes = await fetchImpl(`${base}/api/v3/auc/bigmodel/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(submitBody),
  });
  if (!submitRes.ok) {
    const t = await submitRes.text().catch(() => '');
    throw new Error(`SeedASR submit ${submitRes.status}: ${t.slice(0, 200)}`);
  }

  for (let i = 0; i < maxPolls; i += 1) {
    await sleep(pollInterval);
    const qRes = await fetchImpl(`${base}/api/v3/auc/bigmodel/query`, {
      method: 'POST',
      headers,
      body: '{}',
    });
    if (!qRes.ok) {
      const t = await qRes.text().catch(() => '');
      throw new Error(`SeedASR query ${qRes.status}: ${t.slice(0, 200)}`);
    }
    const raw = await qRes.text();
    if (!raw || raw === '{}') continue;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    if (data?.code != null && String(data.code) !== '0') {
      throw new Error(`SeedASR 错误：${data.message || data.code}`);
    }
    if (data?.result?.text) return data.result.text;
  }

  throw new Error('转写超时，请稍后重试');
}
