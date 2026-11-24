import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createStore } from '../services/dataStore.js';
import { createAuthRouter } from '../routes/auth.js';

function makeApp(store) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter({ store }));
  return app;
}

describe('auth 路由', () => {
  const file = path.join(tmpdir(), `kaipai-auth-${process.pid}-${Date.now()}.json`);
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

  it('注册成功并自动登录，设置 httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'director', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('director');
    const setCookie = res.headers['set-cookie'][0];
    expect(setCookie).toContain('kaipai_session=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('注册校验：空用户名、短密码、重复注册', async () => {
    const empty = await request(app)
      .post('/api/auth/register')
      .send({ username: ' ', password: 'secret123' });
    expect(empty.status).toBe(400);
    const shortPwd = await request(app)
      .post('/api/auth/register')
      .send({ username: 'u2', password: '123' });
    expect(shortPwd.status).toBe(400);
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'dup', password: 'secret123' });
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dup', password: 'secret123' });
    expect(dup.status).toBe(409);
  });

  it('登录成功返回用户，错误密码与不存在用户均返回统一 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'login', password: 'secret123' });
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ username: 'login', password: 'secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.username).toBe('login');
    const bad = await request(app)
      .post('/api/auth/login')
      .send({ username: 'login', password: 'nope' });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toContain('用户名或密码');
    const nobody = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'whatever' });
    expect(nobody.status).toBe(401);
    expect(nobody.body.error).toContain('用户名或密码');
  });

  it('会话随 cookie 变化，登出后会话失效', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ username: 'sess', password: 'secret123' });
    const cookie = reg.headers['set-cookie'][0].split(';')[0];

    const active = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(active.body.user.username).toBe('sess');
    const anon = await request(app).get('/api/auth/session');
    expect(anon.body.user).toBeNull();

    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);
    const after = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(after.body.user).toBeNull();
  });

  it('连续失败 5 次后触发限流 429', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'lockme', password: 'secret123' });
    let last;
    for (let i = 0; i < 5; i += 1) {
      last = await request(app)
        .post('/api/auth/login')
        .send({ username: 'lockme', password: 'wrong' });
    }
    expect(last.status).toBe(401);
    const locked = await request(app)
      .post('/api/auth/login')
      .send({ username: 'lockme', password: 'secret123' });
    expect(locked.status).toBe(429);
  });
});
