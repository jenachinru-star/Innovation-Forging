import { Router } from 'express';
import { transcribeAudio } from '../services/seedasr.js';
import { summarizeDiscussion } from '../services/discussion.js';

function mimeToFormat(mime) {
  const base = String(mime || '').split(';')[0].trim();
  const format = base.includes('/') ? base.split('/')[1] : base;
  return format || 'webm';
}

export function createDiscussionRouter(deps = {}) {
  const transcribe = deps.transcribeAudio || transcribeAudio;
  const summarize = deps.summarizeDiscussion || summarizeDiscussion;
  const router = Router();

  router.post('/analyze', async (req, res) => {
    const kind = req.body?.kind === 'audio' ? 'audio' : 'text';
    try {
      let transcript = '';

      if (kind === 'audio') {
        const audioData = typeof req.body?.audioData === 'string' ? req.body.audioData : '';
        if (!audioData) return res.status(400).json({ error: '缺少录音数据' });
        const format = mimeToFormat(req.body?.audioFormat);
        transcript = await transcribe({ audioData, format });
      } else {
        transcript = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
        if (!transcript) return res.status(400).json({ error: '请输入讨论内容' });
      }

      const summary = await summarize(transcript);
      return res.json({ transcript, summary });
    } catch (e) {
      return res
        .status(502)
        .json({ error: '讨论分析失败', detail: String(e?.message || e) });
    }
  });

  return router;
}
