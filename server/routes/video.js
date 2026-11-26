import { Router } from 'express';
import { createVideoTask, getVideoTask } from '../services/seedance.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { sendUpstreamError } from '../services/upstreamError.js';
import { videoTaskSchema } from '../schemas/ai.js';

const TASK_ID_RE = /^[\w-]{1,128}$/;

// 判断任务是否属于当前用户。新任务以登记的创建者为准；
// 本次改动之前创建的任务没有登记，回退到用户自己项目 assets 里的 taskId，并补登记。
function ownsTask(store, username, taskId) {
  const owner = store.getVideoTaskOwner(taskId);
  if (owner) return owner === username;
  const inOwnProject = store.listProjectsByUser(username).some((project) => {
    const assets = Array.isArray(project?.plan?.assets) ? project.plan.assets : [];
    return assets.some((asset) => asset && asset.taskId === taskId);
  });
  if (inOwnProject) store.putVideoTask(taskId, username);
  return inOwnProject;
}

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
      if (deps.store && TASK_ID_RE.test(String(task.id))) {
        deps.store.putVideoTask(String(task.id), req.user.username);
      }
      return res.status(202).json({ taskId: task.id, status: task.status });
    } catch (e) {
      return sendUpstreamError(res, '视频任务创建失败', e);
    }
  });

  // 查询视频任务状态
  router.get('/tasks/:id', async (req, res) => {
    // 任务 ID 只允许安全字符，防止 "../" 之类改写上游请求路径
    if (!TASK_ID_RE.test(req.params.id)) {
      return res.status(400).json({ error: '任务 ID 不合法' });
    }
    // 不属于当前用户的任务一律按不存在处理，不暴露他人的任务与视频地址
    if (deps.store && !ownsTask(deps.store, req.user.username, req.params.id)) {
      return res.status(404).json({ error: '任务不存在' });
    }
    try {
      const task = await query(req.params.id);
      return res.json({
        taskId: task.id,
        status: task.status,
        videoUrl: task.videoUrl,
        error: task.error,
      });
    } catch (e) {
      return sendUpstreamError(res, '视频任务查询失败', e);
    }
  });

  return router;
}
