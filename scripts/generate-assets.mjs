// 一次性资产生成脚本：调用 Seedream 真出图，并把图片固化到 client/src/assets/samples。
// 用法：node scripts/generate-assets.mjs
// 仅在开发期运行；密钥从 server/.env 读取，不会写进前端产物。
import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const BASE = process.env.SEEDREAM_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = process.env.SEEDREAM_MODEL;
const KEY = process.env.SEEDREAM_API_KEY;

const OUT_DIR = path.join(__dirname, '..', 'client', 'src', 'assets', 'samples');

const PORTRAIT_STYLE =
  '写实电影感水彩肖像，暖色调，柔和光线，半身构图，简化背景，细腻笔触，戏剧海报质感，画面中不要出现任何文字、字母或数字';
const SCENE_STYLE =
  '电影感场景，细腻光影，戏剧氛围，暖色调为主，构图克制，画面中不要出现任何文字、字母、数字或水印';

const ASSETS = [
  // —— 人物形象（3）——
  {
    file: 'char-chen.png',
    size: '1024x1024',
    prompt: `中国老年男性，六十多岁，面容沧桑却温和，独居父亲，眼神沉默而慈爱，穿朴素深色毛衣。${PORTRAIT_STYLE}`,
  },
  {
    file: 'char-lan.png',
    size: '1024x1024',
    prompt: `中国年轻女性，二十岁出头，清秀内敛，神情带着久别归家的复杂情绪，穿朴素的浅色外套。${PORTRAIT_STYLE}`,
  },
  {
    file: 'char-zhou.png',
    size: '1024x1024',
    prompt: `中国老年男性，六十多岁，慈祥热心的邻居，面带和善笑容，衣着朴素，略见腿脚不便。${PORTRAIT_STYLE}`,
  },
  // —— 视觉页场景（3）——
  {
    file: 'scene-livingroom.png',
    size: '1280x720',
    prompt: `夜里的老式朴素客厅，桌上放着一把旧钥匙，一盏暖黄色台灯，安静而略带思念的氛围。${SCENE_STYLE}`,
  },
  {
    file: 'scene-doorway.png',
    size: '1280x720',
    prompt: `昏暗的居民楼楼道，顶灯忽明忽暗，门外下着雨，一把雨伞靠在门边，潮湿而安静。${SCENE_STYLE}`,
  },
  {
    file: 'scene-key.png',
    size: '1280x720',
    prompt: `特写，一只苍老的手把一把钥匙轻轻放进年轻的手心，暖光，充满情感与不舍。${SCENE_STYLE}`,
  },
  // —— 作品库封面（8）——
  {
    file: 'cover-yeyeguiren.png',
    size: '1280x720',
    prompt: `雨夜的小巷，一个撑伞独行的背影，路灯在湿润地面投下倒影，孤寂而温暖。${SCENE_STYLE}`,
  },
  {
    file: 'cover-chunshan-1.png',
    size: '1280x720',
    prompt: `中国水墨山水，云雾缭绕的远山，一枝桃花斜出，留白意境，淡雅国风。${SCENE_STYLE}`,
  },
  {
    file: 'cover-chunshan-2.png',
    size: '1280x720',
    prompt: `中国水墨山水，层叠青山与云海，近处花枝，构图与常见山水不同，宁静悠远。${SCENE_STYLE}`,
  },
  {
    file: 'cover-xiyurensheng.png',
    size: '1280x720',
    prompt: `空旷的深色舞台，一束聚光灯打在孤零零的一把椅子上，背景沉入黑暗，戏剧感强烈。${SCENE_STYLE}`,
  },
  {
    file: 'cover-wanmo.png',
    size: '1280x720',
    prompt: `夜晚，一个人坐在窗边静静望着窗外的月亮，室内昏暗，安静孤独的氛围。${SCENE_STYLE}`,
  },
  {
    file: 'cover-fengshengren.png',
    size: '1280x720',
    prompt: `暖光斜照的木桌，桌上摊开一封旧信纸，尘埃在光束中缓缓浮动，温柔怀旧。${SCENE_STYLE}`,
  },
  {
    file: 'cover-fengzhongdexin.png',
    size: '1280x720',
    prompt: `暖光下的旧信纸上放着一支麦穗，质地细腻，安静而有希望的氛围。${SCENE_STYLE}`,
  },
  {
    file: 'cover-riguangzhixia.png',
    size: '1280x720',
    prompt: `黄昏的海边，一个人坐在礁石上望向夕阳，海面泛着金光，开阔而治愈。${SCENE_STYLE}`,
  },
];

async function requestImage(prompt, size) {
  const res = await fetch(`${BASE}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size, response_format: 'b64_json' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`API ${res.status}: ${text.slice(0, 160)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const item = data?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) {
    const r = await fetch(item.url);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error('响应中没有图片');
}

async function generateImage(asset) {
  try {
    return await requestImage(asset.prompt, asset.size);
  } catch (err) {
    // 尺寸不被支持时回退到正方形
    if (asset.size !== '1024x1024') {
      console.warn(`  ↳ 尺寸 ${asset.size} 失败，回退 1024x1024（${err.message}）`);
      return requestImage(asset.prompt, '1024x1024');
    }
    throw err;
  }
}

async function main() {
  if (!KEY || !MODEL) {
    console.error('缺少 SEEDREAM_API_KEY / SEEDREAM_MODEL，请先配置 server/.env');
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });
  const ok = [];
  const failed = [];

  for (let i = 0; i < ASSETS.length; i += 1) {
    const asset = ASSETS[i];
    process.stdout.write(`[${i + 1}/${ASSETS.length}] ${asset.file} ... `);
    try {
      const buffer = await generateImage(asset);
      await writeFile(path.join(OUT_DIR, asset.file), buffer);
      console.log(`完成（${(buffer.length / 1024).toFixed(0)} KB）`);
      ok.push(asset.file);
    } catch (err) {
      console.log(`失败：${err.message}`);
      failed.push(asset.file);
    }
  }

  console.log('\n==== 汇总 ====');
  console.log(`成功 ${ok.length} 张：${ok.join('、') || '无'}`);
  if (failed.length) console.log(`失败 ${failed.length} 张：${failed.join('、')}`);
}

main().catch((err) => {
  console.error('脚本异常：', err);
  process.exit(1);
});
