import { Router } from 'express';
import multer from 'multer';
import * as llm from '../services/llm.js';
import * as extractService from '../services/extract.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { sendUpstreamError } from '../services/upstreamError.js';
import { scriptGenerateSchema, scriptParseSchema } from '../schemas/ai.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5, fieldSize: 1024 },
});

export function createScriptRouter(deps = {}) {
  const generateScript = deps.generateScript || llm.generateScript;
  const parseScript = deps.parseScript || llm.parseScript;
  const extractText = deps.extractText || extractService.extractText;

  const router = Router();
  if (deps.store) router.use(createRequireAuth(deps.store));

  router.post('/generate', validate(scriptGenerateSchema), async (req, res) => {
    const { material } = req.body;
    try {
      const result = await generateScript(material);
      if (result.needMoreInfo) {
        return res.json({ error: result.question, needMoreInfo: true });
      }
      return res.json({ scriptText: result.scriptText });
    } catch (e) {
      return sendUpstreamError(res, '生成失败，请重试', e);
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
        // 损坏或无法解析的文件属于输入问题，返回 400；解析库内部错误只记日志
        const msg = String(e?.message || e);
        if (msg.includes('不支持的文件类型')) return res.status(400).json({ error: msg });
        console.error('[extract] failed:', e);
        return res.status(400).json({ error: '文件无法解析，请确认文件未损坏且包含可提取的文字' });
      }
    });
  });

  router.post('/parse', validate(scriptParseSchema), async (req, res) => {
    const { scriptText } = req.body;
    try {
      const scriptData = await parseScript(scriptText);
      return res.json({ scriptData });
    } catch (e) {
      return sendUpstreamError(res, '解析失败，请重试', e);
    }
  });

  return router;
}
