import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('createApp', () => {
  it('健康检查可用', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
  it('已挂载 /api/script 路由（空解析返回 400 而非 404）', async () => {
    const res = await request(createApp()).post('/api/script/parse').send({});
    expect(res.status).toBe(400);
  });
  it('已挂载 /api/character 路由', async () => {
    const res = await request(createApp()).post('/api/character/generate-image').send({});
    expect(res.status).toBe(501);
  });
});
