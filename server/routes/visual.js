import { Router } from 'express';
import { generateVisualImage } from '../services/seedream.js';

export function createVisualRouter(deps = {}) {
  const generate = deps.generateVisualImage || generateVisualImage;
  const router = Router();

  router.post('/generate', async (req, res) => {
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const styleName =
      typeof req.body?.styleName === 'string' ? req.body.styleName.trim() : '';
    const size = typeof req.body?.size === 'string' ? req.body.size : '1024x1024';

    if (!description) return res.status(400).json({ error: '请先描述想要的画面' });

    const prompt = `视觉风格：${styleName || '戏剧化深色舞台'}。画面描述：${description}`;
    try {
      const imageUrl = await generate(prompt, { size });
      return res.json({ imageUrl });
    } catch (e) {
      return res.status(502).json({ error: '生成失败', detail: String(e?.message || e) });
    }
  });

  return router;
}
