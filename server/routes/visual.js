import { Router } from 'express';
import { generateVisualImage } from '../services/seedream.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { visualGenerateSchema } from '../schemas/ai.js';

export function createVisualRouter(deps = {}) {
  const generate = deps.generateVisualImage || generateVisualImage;
  const router = Router();
  if (deps.store) router.use(createRequireAuth(deps.store));

  router.post('/generate', validate(visualGenerateSchema), async (req, res) => {
    const { description, styleName, size } = req.body;
    const prompt = `视觉风格：${styleName || '戏剧化深色舞台'}。画面描述：${description}`;
    try {
      const imageUrl = await generate(prompt, { size: size || '1024x1024' });
      return res.json({ imageUrl });
    } catch (e) {
      return res.status(502).json({ error: '生成失败', detail: String(e?.message || e) });
    }
  });

  return router;
}
