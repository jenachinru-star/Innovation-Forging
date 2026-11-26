import { Router } from 'express';
import { transcribeAudio } from '../services/seedasr.js';
import { summarizeDiscussion } from '../services/discussion.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { sendUpstreamError } from '../services/upstreamError.js';
import { discussionAnalyzeSchema } from '../schemas/ai.js';

function mimeToFormat(mime) {
  const base = String(mime || '').split(';')[0].trim();
  const format = base.includes('/') ? base.split('/')[1] : base;
  return format || 'webm';
}

export function createDiscussionRouter(deps = {}) {
  const transcribe = deps.transcribeAudio || transcribeAudio;
  const summarize = deps.summarizeDiscussion || summarizeDiscussion;
  const router = Router();
  if (deps.store) router.use(createRequireAuth(deps.store));

  router.post('/analyze', validate(discussionAnalyzeSchema), async (req, res) => {
    const { kind, text, audioData, audioFormat } = req.body;
    const mode = kind === 'audio' ? 'audio' : 'text';
    try {
      let transcript = '';

      if (mode === 'audio') {
        if (!audioData) return res.status(400).json({ error: '缺少录音数据' });
        const format = mimeToFormat(audioFormat);
        transcript = await transcribe({ audioData, format });
      } else {
        transcript = (text || '').trim();
        if (!transcript) return res.status(400).json({ error: '请输入讨论内容' });
      }

      const summary = await summarize(transcript);
      return res.json({ transcript, summary });
    } catch (e) {
      return sendUpstreamError(res, '讨论分析失败', e);
    }
  });

  return router;
}
