import { Router } from 'express';
import { createVideoTask, getVideoTask } from '../services/seedance.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { videoTaskSchema } from '../schemas/ai.js';

export function createVideoRouter(deps = {}) {
  const create = deps.createVideoTask || createVideoTask;
  const query = deps.getVideoTask || getVideoTask;
  const router = Router();
  if (deps.store) router.use(createRequireAuth(deps.store));

  // 创建视频任务，立即返回任务 ID（异步两段式）
  router.post('/tasks', validate(videoTaskSchema), async (req, res) => {
    const { prompt, ratio, duration, imageUrl } = req.body;

    try {
      const task = await create({
        prompt,
        ratio: ratio || '16:9',
        duration: duration ?? 5,
        imageUrl: imageUrl || '',
      });
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
