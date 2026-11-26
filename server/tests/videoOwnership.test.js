// 不使用 mock：真实 createApp + 真实 store（落盘）+ 一个本机真实 HTTP 服务充当上游 Seedance。
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createApp } from '../app.js';
import { createStore } from '../services/dataStore.js';

let upstream;
let upstreamHits;
let nextTask = 0;
const file = path.join(tmpdir(), `kaipai-vidown-${process.pid}-${Date.now()}.json`);
let store;
let app;

beforeAll(async () => {
  upstreamHits = [];
  upstream = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      upstreamHits.push(`${req.method} ${req.url}`);
      res.setHeader('Content-Type', 'application/json');
      if (req.method === 'POST') {
        nextTask += 1;
        return res.end(JSON.stringify({ id: `cgt-${nextTask}`, status: 'queued' }));
      }
      const id = req.url.split('/').pop();
      res.end(JSON.stringify({ id, status: 'succeeded', content: { video_url: `http://cdn/${id}.mp4` } }));
    });
  });
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  process.env.SEEDANCE_BASE_URL = `http://127.0.0.1:${upstream.address().port}`;
  process.env.SEEDANCE_API_KEY = 'test-key';
  process.env.SEEDANCE_MODEL = 'm';

  store = await createStore(file).init();
  app = await createApp({ store });
});

afterAll(async () => {
  await store.flush();
  await new Promise((r) => upstream.close(r));
  await rm(file, { force: true });
  delete process.env.SEEDANCE_BASE_URL;
  delete process.env.SEEDANCE_API_KEY;
  delete process.env.SEEDANCE_MODEL;
});

async function login(username) {
  const res = await request(app).post('/api/auth/register').send({ username, password: 'secret123' });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'][0].split(';')[0];
}

describe('视频任务归属', () => {
  it('创建者能查自己的任务，其他登录用户查同一个 taskId 得到 404 且不会请求上游', async () => {
    const alice = await login('alice01');
    const bob = await login('bob0001');

    const created = await request(app).post('/api/video/tasks').set('Cookie', alice).send({ prompt: '镜头推进' });
    expect(created.status).toBe(202);
    const taskId = created.body.taskId;

    const own = await request(app).get(`/api/video/tasks/${taskId}`).set('Cookie', alice);
    expect(own.status).toBe(200);
    expect(own.body.videoUrl).toBe(`http://cdn/${taskId}.mp4`);

    const before = upstreamHits.length;
    const other = await request(app).get(`/api/video/tasks/${taskId}`).set('Cookie', bob);
    expect(other.status).toBe(404);
    expect(JSON.stringify(other.body)).not.toContain('cdn');
    expect(upstreamHits.length).toBe(before);
  });

  it('归属记录会落盘，服务重启后依然有效', async () => {
    const carol = await login('carol01');
    const mallory = await login('mallory1');
    const created = await request(app).post('/api/video/tasks').set('Cookie', carol).send({ prompt: 'x' });
    await store.flush();

    const restarted = await createApp({ store: await createStore(file).init() });
    const own = await request(restarted).get(`/api/video/tasks/${created.body.taskId}`).set('Cookie', carol);
    expect(own.status).toBe(200);
    const other = await request(restarted).get(`/api/video/tasks/${created.body.taskId}`).set('Cookie', mallory);
    expect(other.status).toBe(404);
  });

  it('升级前创建的任务（无登记）：只有其项目 assets 里引用它的用户能查，并自动补登记', async () => {
    const dave = await login('dave001');
    const eve = await login('eve0001');
    const put = await request(app).put('/api/projects/legacy-p').set('Cookie', dave).send({
      name: '旧作品',
      plan: { assets: [{ id: 'asset-1', type: 'video', taskId: 'cgt-legacy', status: 'selected' }] },
    });
    expect(put.status).toBe(200);
    expect(store.getVideoTaskOwner('cgt-legacy')).toBeNull();

    const other = await request(app).get('/api/video/tasks/cgt-legacy').set('Cookie', eve);
    expect(other.status).toBe(404);
    const own = await request(app).get('/api/video/tasks/cgt-legacy').set('Cookie', dave);
    expect(own.status).toBe(200);
    expect(store.getVideoTaskOwner('cgt-legacy')).toBe('dave001');
  });

  it('未登录不能查询', async () => {
    const res = await request(app).get('/api/video/tasks/cgt-1');
    expect(res.status).toBe(401);
  });
});
