import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScriptRouter } from './routes/script.js';
import { createCharacterRouter } from './routes/character.js';
import { createVisualRouter } from './routes/visual.js';
import { createVideoRouter } from './routes/video.js';
import { createDiscussionRouter } from './routes/discussion.js';
import { createAssistantRouter } from './routes/assistant.js';
import { createAuthRouter } from './routes/auth.js';
import { createProjectsRouter } from './routes/projects.js';
import { createStatsRouter } from './routes/stats.js';
import { createStore } from './services/dataStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createApp(deps = {}) {
  const store = deps.store || (await createStore().init());
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', createAuthRouter({ store }));
  app.use('/api/projects', createProjectsRouter({ store }));
  app.use('/api/script', createScriptRouter({ store }));
  app.use('/api/character', createCharacterRouter({ store }));
  app.use('/api/visual', createVisualRouter({ store }));
  app.use('/api/video', createVideoRouter({ store }));
  app.use('/api/discussion', createDiscussionRouter({ store }));
  app.use('/api/assistant', createAssistantRouter({ store }));
  app.use('/api/stats', createStatsRouter({ store }));

  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  // 兜底错误处理：非法 JSON、body 过大等统一返回 JSON，不暴露堆栈
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = Number(err?.status || err?.statusCode) || 500;
    if (status >= 500) console.error('[app] unhandled error:', err);
    const messages = { 400: '请求格式不正确', 413: '请求内容过大' };
    return res.status(status).json({ error: messages[status] || (status >= 500 ? '服务器内部错误' : '请求失败') });
  });

  return app;
}
