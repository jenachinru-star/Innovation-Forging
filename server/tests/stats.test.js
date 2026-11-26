import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createStore } from '../services/dataStore.js';
import { createAuthRouter } from '../routes/auth.js';
import { createStatsRouter } from '../routes/stats.js';

function makeApp(store) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter({ store }));
  app.use('/api/stats', createStatsRouter({ store }));
  return app;
}

async function cookieFor(app, username, password = 'secret123') {
  await request(app).post('/api/auth/register').send({ username, password });
  const login = await request(app).post('/api/auth/login').send({ username, password });
  return login.headers['set-cookie'][0].split(';')[0];
}

describe('/api/stats 项目统计', () => {
  const file = path.join(tmpdir(), `kaipai-stats-${process.pid}-${Date.now()}.json`);
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

  it('未登录返回 401', async () => {
    const res = await request(app).get('/api/stats/x');
    expect(res.status).toBe(401);
  });

  it('返回本人作品的聚合计数', async () => {
    const cookie = await cookieFor(app, 'dave');
    store.putProject('p1', {
      id: 'p1',
      userId: 'dave',
      name: '统计项目',
      scriptData: {
        scenes: [
          { sceneNumber: 1, props: ['伞', '书'], characters: ['老陈'] },
          { sceneNumber: 2, props: [], characters: ['老陈', '小林'] },
        ],
        characters: [{ name: '老陈' }, { name: '小林' }],
      },
      plan: {
        cues: [{ id: 'cue-1', status: 'draft' }],
        briefs: [{ id: 'brief-1', status: 'open' }],
        impacts: [{ status: 'open' }, { status: 'accepted' }],
        assets: [{ id: 'a-1' }],
        discussions: [{ id: 'd-1' }],
      },
    });

    const res = await request(app).get('/api/stats/p1').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({
      sceneCount: 2,
      characterCount: 2,
      relationshipCount: 0,
      cueCount: 1,
      briefCount: 1,
      rehearsalCount: 0,
      impactOpenCount: 1,
      assetCount: 1,
      discussionCount: 1,
      propTotal: 2,
    });
  });

  it('他人作品返回 404', async () => {
    const cookieA = await cookieFor(app, 'alice-s');
    const cookieB = await cookieFor(app, 'bob-s');
    store.putProject('secret-s', { id: 'secret-s', userId: 'alice-s', name: '私密' });
    const res = await request(app).get('/api/stats/secret-s').set('Cookie', cookieB);
    expect(res.status).toBe(404);
  });
});