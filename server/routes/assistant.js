import { Router } from 'express';
import * as assistantService from '../services/assistant.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { sendUpstreamError } from '../services/upstreamError.js';
import { assistantChatSchema } from '../schemas/assistant.js';

export function createAssistantRouter(deps = {}) {
  const runAssistant = deps.runAssistant || assistantService.runAssistant;
  const router = Router();
  if (deps.store) router.use(createRequireAuth(deps.store));

  router.post('/chat', validate(assistantChatSchema), async (req, res) => {
    const { messages, context } = req.body;
    try {
      const result = await runAssistant(messages, context || {});
      return res.json(result);
    } catch (e) {
      return sendUpstreamError(res, 'AI 助手调用失败', e);
    }
  });

  return router;
}
