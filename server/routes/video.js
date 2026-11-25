import { Router } from 'express';
import { createVideoTask, getVideoTask } from '../services/seedance.js';

export function createVideoRouter(deps = {}) {
  const create = deps.createVideoTask || createVideoTask;
  const query = deps.getVideoTask || getVideoTask;
  const router = Router();

  // 创建视频任务，立即返回任务 ID（异步两段式）
  router.post('/tasks', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) return res.status(400).json({ error: '请先描述想要的镜头' });

    const ratio = typeof req.body?.ratio === 'string' ? req.body.ratio : '16:9';
    const duration = Number(req.body?.duration) || 5;
    const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : '';

    try {
      const task = await create({ prompt, ratio, duration, imageUrl });
      return res.status(202).json({ taskId: task.id, status: task.status });
    } catch (e) {
      return res
        .status(502)
        .json({ error: '视频任务创建失败', detail: String(e?.message || e) });
    }
  });

  // 查询视频任务状态
  router.get('/tasks/:id', async (req, res) => {
    try {
      const task = await query(req.params.id);
      return res.json({
        taskId: task.id,
        status: task.status,
        videoUrl: task.videoUrl,
        error: task.error,
      });
    } catch (e) {
      return res
        .status(502)
        .json({ error: '视频任务查询失败', detail: String(e?.message || e) });
    }
  });

  return router;
}
