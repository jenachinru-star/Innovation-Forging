import { generateVisualImage } from './seedream.js';

const ALLOWED_SIZES = ['1024x1024', '1024x1792', '1792x1024'];

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description:
        '当用户需要舞台灯光、舞美置景、人物造型、分镜、机位或光影等视觉参考图时调用，生成图片。',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: '完整画面描述，使用舞台/灯光/舞美专业术语' },
          style: { type: 'string', description: '画面风格，如写实、暖棕金电影感、油画感、复古胶片' },
          size: { type: 'string', enum: ALLOWED_SIZES, description: '方图/竖图/横图' },
        },
        required: ['prompt'],
      },
    },
  },
];

function buildSystem(context) {
  const ctx = context && typeof context === 'object' ? context : {};
  const lines = [
    '你是「开排」编导工作台内置的 AI 助手，服务于话剧导演与编剧。',
    '能力：',
    '1) 回答话剧编剧、导演、舞台灯光、舞美、音乐音响、排练相关问题，建议要具体、可执行。',
    '2) 当用户描述想找某个看过但忘了名字的剧或画面时，基于知识给出候选剧名与画面描述；把握不足要明确说明，不要编造确定答案。',
    '3) 当用户需要视觉参考（灯光效果、舞美置景、人物造型、分镜、机位、光影）时，调用 generate_image 工具；prompt 必须使用舞台专业术语，并默认体现“舞台、暖色调、戏剧氛围”，避免生成影视场景。',
    '规则：不确定就说明，不编造；回答简洁专业，默认使用中文。',
  ];
  if (ctx.projectName) {
    lines.push(`当前作品：${ctx.projectName}${ctx.sceneCount ? `，共 ${ctx.sceneCount} 场` : ''}${
      ctx.characterCount ? `，${ctx.characterCount} 个角色` : ''
    }。`);
  }
  return lines.join('\n');
}

function normalizeSize(size) {
  return ALLOWED_SIZES.includes(size) ? size : '1024x1024';
}

function buildImagePrompt(args) {
  const parts = [String(args.prompt || '').trim()];
  if (args.style) parts.push(String(args.style).trim());
  parts.push('舞台场景而非影视，写实光影，戏剧氛围');
  return parts.filter(Boolean).join('，');
}

async function callChat(messages, { tools } = {}) {
  const base = process.env.OPENAI_NEXT_BASE_URL;
  const key = process.env.OPENAI_NEXT_API_KEY;
  const model = process.env.ASSISTANT_MODEL || process.env.CHAT_MODEL || 'gpt-5.4-mini';

  const body = { model, messages, temperature: 0.7 };
  if (tools) body.tools = tools;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  let res;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('AI 助手请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`AI 助手 API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  if (!msg) throw new Error('AI 助手返回为空');
  return msg;
}

/**
 * 运行一次助手回合。
 * @param {Array<{role:string, content:string}>} history 历史消息（不含 system）
 * @param {object} context 作品上下文
 * @returns {Promise<{content:string, images:Array<{url:string, prompt:string}>}>}
 */
export async function runAssistant(history, context = {}) {
  const messages = [{ role: 'system', content: buildSystem(context) }, ...history];

  let response = await callChat(messages, { tools: TOOLS });
  const generatedImages = [];

  // 处理工具调用；最多 3 轮，防止无限循环
  let guard = 0;
  while (Array.isArray(response.tool_calls) && response.tool_calls.length && guard < 3) {
    guard += 1;
    messages.push(response);

    for (const tc of response.tool_calls) {
      if (tc.function?.name !== 'generate_image') {
        messages.push({ role: 'tool', tool_call_id: tc.id, content: '该工具不可用' });
        continue;
      }
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {
        args = {};
      }
      const size = normalizeSize(args.size);
      const prompt = buildImagePrompt(args);
      try {
        const url = await generateVisualImage(prompt, { size });
        generatedImages.push({ url, prompt });
        messages.push({ role: 'tool', tool_call_id: tc.id, content: `图片已生成：${url}` });
      } catch (e) {
        messages.push({ role: 'tool', tool_call_id: tc.id, content: `图片生成失败：${e.message}` });
      }
    }

    response = await callChat(messages, { tools: TOOLS });
  }

  return {
    content: typeof response.content === 'string' ? response.content : '',
    images: generatedImages,
  };
}
