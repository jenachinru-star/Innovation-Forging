import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createVideoRouter } from '../routes/video.js';

function buildApp(deps) {
  const app = express();
  app.use(express.json());
  app.use('/api/video', createVideoRouter(deps));
  return app;
}

it('缺少 prompt 时返回 400', async () => {
  const res = await request(buildApp()).post('/api/video/tasks').send({});
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('镜头');
});

it('创建成功返回 202 与 taskId', async () => {
  const create = async () => ({ id: 'cgt-1', status: 'queued' });
  const res = await request(buildApp({ createVideoTask: create }))
    .post('/api/video/tasks')
    .send({ prompt: '镜头推进', ratio: '16:9', duration: 5 });
  expect(res.status).toBe(202);
  expect(res.body.taskId).toBe('cgt-1');
});

it('创建服务抛错时返回 502', async () => {
  const create = async () => {
    throw new Error('boom');
  };
  const res = await request(buildApp({ createVideoTask: create }))
    .post('/api/video/tasks')
    .send({ prompt: 'x' });
  expect(res.status).toBe(502);
});

it('查询返回状态与 videoUrl', async () => {
  const query = async () => ({
    id: 'cgt-1',
    status: 'succeeded',
    videoUrl: 'http://v/1.mp4',
    error: '',
  });
  const res = await request(buildApp({ getVideoTask: query })).get(
    '/api/video/tasks/cgt-1'
  );
  expect(res.status).toBe(200);
  expect(res.body.videoUrl).toBe('http://v/1.mp4');
});
