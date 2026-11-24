import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createApp } from '../app.js';
import { createStore } from '../services/dataStore.js';

describe('createApp', () => {
  const file = path.join(tmpdir(), `kaipai-app-${process.pid}-${Date.now()}.json`);
  let app;
  let store;

  beforeEach(async () => {
    store = createStore(file);
    await store.init();
    app = await createApp({ store });
  });

  afterEach(async () => {
    await store.flush();
    await rm(file, { force: true });
  });

  it('健康检查可用', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('挂载 /api/script 路由（空解析 400 而非 404）', async () => {
    const res = await request(app).post('/api/script/parse').send({});
    expect(res.status).toBe(400);
  });

  it('挂载 /api/character 路由（空请求 400 而非 404）', async () => {
    const res = await request(app).post('/api/character/generate-image').send({});
    expect(res.status).toBe(400);
  });

  it('挂载 /api/auth 与受保护的 /api/projects', async () => {
    const session = await request(app).get('/api/auth/session');
    expect(session.status).toBe(200);
    expect(session.body.user).toBeNull();
    const protectedList = await request(app).get('/api/projects');
    expect(protectedList.status).toBe(401);
  });
});
