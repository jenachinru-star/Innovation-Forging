import { Router } from 'express';
import { generateCharacterImage } from '../services/seedream.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { sendUpstreamError } from '../services/upstreamError.js';
import { characterImageSchema } from '../schemas/ai.js';

export function createCharacterRouter(deps = {}) {
  const generate = deps.generateCharacterImage || generateCharacterImage;
  const router = Router();
  if (deps.store) router.use(createRequireAuth(deps.store));
  router.post('/generate-image', validate(characterImageSchema), async (req, res) => {
    const { name, description, stylePrompt } = req.body;
    try {
      const imageUrl = await generate(description, { stylePrompt });
      return res.json({ name, imageUrl });
    } catch (e) {
      return sendUpstreamError(res, '生成失败', e);
    }
  });
  return router;
}
