import { Router } from 'express';
import { createRequireAuth } from '../middleware/requireAuth.js';

export function createProjectsRouter(deps = {}) {
  const store = deps.store;
  const requireAuth = createRequireAuth(store);
  const router = Router();

  router.use(requireAuth);

  router.get('/', (req, res) => {
    const projects = store
      .listProjectsByUser(req.user.username)
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    return res.json({ projects });
  });

  router.get('/:id', (req, res) => {
    const record = store.getProject(req.params.id);
    // 不属于当前用户一律按不存在处理，避免暴露他人作品
    if (!record || record.userId !== req.user.username) {
      return res.status(404).json({ error: '作品不存在' });
    }
    return res.json({ project: record });
  });

  router.put('/:id', (req, res) => {
    const id = req.params.id;
    const existing = store.getProject(id);
    // 已存在但不属于当前用户：按不存在处理，杜绝越权改写/抢占他人作品
    if (existing && existing.userId !== req.user.username) {
      return res.status(404).json({ error: '作品不存在' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    // 强制归属当前登录用户，忽略任何客户端传入的 userId
    const record = { ...body, id, userId: req.user.username };
    store.putProject(id, record);
    return res.json({ project: record });
  });

  router.delete('/:id', (req, res) => {
    const existing = store.getProject(req.params.id);
    if (!existing || existing.userId !== req.user.username) {
      return res.status(404).json({ error: '作品不存在' });
    }
    store.deleteProject(req.params.id);
    return res.json({ ok: true });
  });

  return router;
}
