import { Router } from 'express';
import multer from 'multer';
import * as llm from '../services/llm.js';
import * as extractService from '../services/extract.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function createScriptRouter(deps = {}) {
  const generateScript = deps.generateScript || llm.generateScript;
  const parseScript = deps.parseScript || llm.parseScript;
  const extractText = deps.extractText || extractService.extractText;

  const router = Router();

  router.post('/generate', async (req, res) => {
    const material = typeof req.body?.material === 'string' ? req.body.material.trim() : '';
    if (!material) return res.status(400).json({ error: '请提供素材内容' });
    try {
      const result = await generateScript(material);
      if (result.needMoreInfo) {
        return res.json({ error: result.question, needMoreInfo: true });
      }
      return res.json({ scriptText: result.scriptText });
    } catch (e) {
      return res.status(502).json({ error: '生成失败，请重试', detail: String(e?.message || e) });
    }
  });

  router.post('/extract', (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: '文件过大或上传失败' });
      }
      if (!req.file) return res.status(400).json({ error: '未收到文件' });
      try {
        const scriptText = await extractText(req.file.buffer, req.file.originalname);
        if (!scriptText) return res.status(400).json({ error: '文件内容为空' });
        return res.json({ scriptText });
      } catch (e) {
        const msg = String(e?.message || e);
        const status = msg.includes('不支持的文件类型') ? 400 : 502;
        return res.status(status).json({ error: msg });
      }
    });
  });

  router.post('/parse', async (req, res) => {
    const scriptText = typeof req.body?.scriptText === 'string' ? req.body.scriptText.trim() : '';
    if (!scriptText) return res.status(400).json({ error: '请提供剧本内容' });
    try {
      const scriptData = await parseScript(scriptText);
      return res.json({ scriptData });
    } catch (e) {
      return res.status(502).json({ error: '解析失败，请重试', detail: String(e?.message || e) });
    }
  });

  return router;
}
