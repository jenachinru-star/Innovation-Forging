import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm, writeFile } from 'node:fs/promises';
import { createStore } from '../services/dataStore.js';
import { createRequireAuth } from '../middleware/requireAuth.js';
import { createVideoRouter } from '../routes/video.js';
import { createApp } from '../app.js';

const files = [];
function tmpFile(tag) {
  const file = path.join(tmpdir(), `kaipai-${tag}-${process.pid}-${Date.now()}-${Math.random()}.json`);
  files.push(file);
  return file;
}

afterEach(async () => {
  await Promise.all(files.splice(0).map((f) => rm(f, { force: true })));
});

describe('会话原型污染防护', () => {
  it('从磁盘加载后，constructor / __proto__ 等 cookie 不能通过鉴权', async () => {
    const file = tmpFile('proto');
    await writeFile(file, JSON.stringify({ users: {}, sessions: {}, projects: {} }), 'utf8');
    const store = await createStore(file).init();
    const app = express();
    app.get('/p', createRequireAuth(store), (req, res) => res.json({ ok: true }));

    for (const token of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      const res = await request(app).get('/p').set('Cookie', `kaipai_session=${token}`);
      expect(res.status).toBe(401);
    }
    await store.flush();
  });
});

describe('写盘失败不拖垮进程', () => {
  it('persist 失败后链条仍可继续，flush 不 reject', async () => {
    // 目标路径是一个已存在的"目录式"非法路径：父级是文件，mkdir 会失败
    const parent = tmpFile('parent');
    await writeFile(parent, 'x', 'utf8');
    const store = createStore(path.join(parent, 'store.json'));
    store.putUser({ username: 'a' });
    await expect(store.flush()).resolves.toBeUndefined();
    store.putUser({ username: 'b' });
    await expect(store.flush()).resolves.toBeUndefined();
    expect(store.getUser('b')).toEqual({ username: 'b' });
  });
});

describe('视频任务 ID 校验', () => {
  it('包含路径穿越字符的 ID 返回 400，且不会请求上游', async () => {
    let called = false;
    const app = express();
    app.use('/api/video', createVideoRouter({ getVideoTask: async () => { called = true; return {}; } }));
    const res = await request(app).get('/api/video/tasks/..%2F..%2Fxxx%3Fa%3Db');
    expect(res.status).toBe(400);
    expect(called).toBe(false);
  });

  it('上游失败时不向客户端透传原始错误', async () => {
    const app = express();
    app.use('/api/video', createVideoRouter({
      getVideoTask: async () => { throw new Error('Incorrect API key provided: sk-secret'); },
    }));
    const res = await request(app).get('/api/video/tasks/task-123');
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('sk-secret');
  });
});

describe('全局错误处理', () => {
  it('非法 JSON 返回 JSON 格式 400，不带堆栈', async () => {
    const store = await createStore(tmpFile('app')).init();
    const app = await createApp({ store });
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"a":');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
    expect(res.text).not.toContain('at ');
    await store.flush();
  });
});
