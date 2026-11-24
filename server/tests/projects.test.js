import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createStore } from '../services/dataStore.js';
import { createAuthRouter } from '../routes/auth.js';
import { createProjectsRouter } from '../routes/projects.js';

function makeApp(store) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter({ store }));
  app.use('/api/projects', createProjectsRouter({ store }));
  return app;
}

async function cookieFor(app, username, password = 'secret123') {
  await request(app).post('/api/auth/register').send({ username, password });
  const login = await request(app).post('/api/auth/login').send({ username, password });
  return login.headers['set-cookie'][0].split(';')[0];
}

describe('projects 行级隔离', () => {
  const file = path.join(tmpdir(), `kaipai-projects-${process.pid}-${Date.now()}.json`);
  let store;
  let app;

  beforeEach(async () => {
    store = createStore(file);
    await store.init();
    app = makeApp(store);
  });

  afterEach(async () => {
    await store.flush();
    await rm(file, { force: true });
  });

  it('未登录访问返回 401', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('两用户各自只看到自己的作品', async () => {
    const cookieA = await cookieFor(app, 'alice');
    const cookieB = await cookieFor(app, 'bob');

    await request(app)
      .put('/api/projects/p-a')
      .set('Cookie', cookieA)
      .send({ name: 'A 的作品', updatedAt: '2026-11-24T00:00:00.000Z' });
    await request(app)
      .put('/api/projects/p-b')
      .set('Cookie', cookieB)
      .send({ name: 'B 的作品', updatedAt: '2026-11-24T01:00:00.000Z' });

    const listA = await request(app).get('/api/projects').set('Cookie', cookieA);
    expect(listA.body.projects.map((p) => p.id)).toEqual(['p-a']);
    const listB = await request(app).get('/api/projects').set('Cookie', cookieB);
    expect(listB.body.projects.map((p) => p.id)).toEqual(['p-b']);
  });

  it('不能读取或删除他人作品，统一返回 404', async () => {
    const cookieA = await cookieFor(app, 'alice2');
    const cookieB = await cookieFor(app, 'bob2');

    await request(app)
      .put('/api/projects/secret')
      .set('Cookie', cookieA)
      .send({ name: '私密' });

    const read = await request(app).get('/api/projects/secret').set('Cookie', cookieB);
    expect(read.status).toBe(404);
    const del = await request(app).delete('/api/projects/secret').set('Cookie', cookieB);
    expect(del.status).toBe(404);
  });

  it('不能越权改写他人已存在作品，返回 404 且原数据不变', async () => {
    const cookieA = await cookieFor(app, 'alice4');
    const cookieB = await cookieFor(app, 'bob4');

    await request(app)
      .put('/api/projects/owned')
      .set('Cookie', cookieA)
      .send({ name: 'A 的原稿' });

    const attack = await request(app)
      .put('/api/projects/owned')
      .set('Cookie', cookieB)
      .send({ name: 'B 试图抢占' });
    expect(attack.status).toBe(404);

    const aRecord = await request(app).get('/api/projects/owned').set('Cookie', cookieA);
    expect(aRecord.body.project.name).toBe('A 的原稿');
    expect(aRecord.body.project.userId).toBe('alice4');
  });

  it('PUT 即使伪造 userId 也被强制归属当前用户', async () => {
    const cookieA = await cookieFor(app, 'alice3');
    const cookieB = await cookieFor(app, 'bob3');

    const res = await request(app)
      .put('/api/projects/forged')
      .set('Cookie', cookieA)
      .send({ name: '尝试越权', userId: 'bob3' });
    expect(res.body.project.userId).toBe('alice3');

    const listB = await request(app).get('/api/projects').set('Cookie', cookieB);
    expect(listB.body.projects.map((p) => p.id)).not.toContain('forged');
  });

  it('保存后可读取，删除后返回 404', async () => {
    const cookie = await cookieFor(app, 'carol');
    await request(app)
      .put('/api/projects/lifecycle')
      .set('Cookie', cookie)
      .send({ name: '生命周期' });
    const got = await request(app).get('/api/projects/lifecycle').set('Cookie', cookie);
    expect(got.body.project.name).toBe('生命周期');
    await request(app).delete('/api/projects/lifecycle').set('Cookie', cookie);
    const after = await request(app).get('/api/projects/lifecycle').set('Cookie', cookie);
    expect(after.status).toBe(404);
  });
});
