import { Router } from 'express';

export function createCharacterRouter(deps = {}) {
  // 加分项在 Task 15 真正实现；此处占位，保证 app 可启动
  void deps;
  const router = Router();
  router.post('/generate-image', (req, res) => {
    res.status(501).json({ error: '角色生图功能尚未启用' });
  });
  return router;
}
