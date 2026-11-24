import { Router } from 'express';
import { generateCharacterImage } from '../services/seedream.js';

export function createCharacterRouter(deps = {}) {
  const generate = deps.generateCharacterImage || generateCharacterImage;
  const router = Router();
  router.post('/generate-image', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const stylePrompt =
      typeof req.body?.stylePrompt === 'string' ? req.body.stylePrompt.trim() : '';
    if (!name || !description) return res.status(400).json({ error: '缺少人物名称或描述' });
    try {
      const imageUrl = await generate(description, { stylePrompt });
      return res.json({ name, imageUrl });
    } catch (e) {
      return res.status(502).json({ error: '生成失败', detail: String(e?.message || e) });
    }
  });
  return router;
}
