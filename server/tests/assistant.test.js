import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createStore } from '../services/dataStore.js';
import { createAuthRouter } from '../routes/auth.js';
import { createAssistantRouter } from '../routes/assistant.js';

function makeApp(store, deps) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter({ store }));
  app.use('/api/assistant', createAssistantRouter({ store, ...deps }));
  return app;
}

async function cookieFor(app, username, password = 'secret123') {
  await request(app).post('/api/auth/register').send({ username, password });
  const login = await request(app).post('/api/auth/login').send({ username, password });
  return login.headers['set-cookie'][0].split(';')[0];
}

describe('assistant 路由', () => {
  const file = path.join(tmpdir(), `kaipai-assistant-${process.pid}-${Date.now()}.json`);
  let store;
  let app;
  let runAssistant;

  beforeEach(async () => {
    store = createStore(file);
    await store.init();
    runAssistant = vi.fn(async () => ({ content: '你好', images: [] }));
    app = makeApp(store, { runAssistant });
  });

  afterEach(async () => {
    await store.flush();
    await rm(file, { force: true });
  });

  it('未登录返回 401', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .send({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.status).toBe(401);
  });

  it('空消息数组校验失败返回 400', async () => {
    const cookie = await cookieFor(app, 'carl');
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Cookie', cookie)
      .send({ messages: [] });
    expect(res.status).toBe(400);
  });

  it('非法 role 校验失败返回 400', async () => {
    const cookie = await cookieFor(app, 'carl');
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Cookie', cookie)
      .send({ messages: [{ role: 'nope', content: 'x' }] });
    expect(res.status).toBe(400);
  });

  it('成功调用并透传结果', async () => {
    const cookie = await cookieFor(app, 'carl');
    const payload = {
      messages: [{ role: 'user', content: '打个光' }],
      context: { projectName: '剧' },
    };
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Cookie', cookie)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ content: '你好', images: [] });
    expect(runAssistant).toHaveBeenCalledWith(payload.messages, payload.context);
  });

  it('上游失败统一返回 502 且不透传细节', async () => {
    const cookie = await cookieFor(app, 'carl');
    runAssistant.mockImplementationOnce(async () => {
      throw new Error('sk-secret upstream boom');
    });
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Cookie', cookie)
      .send({ messages: [{ role: 'user', content: 'x' }] });
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('AI 助手调用失败');
    expect(JSON.stringify(res.body)).not.toContain('sk-secret');
  });
});
