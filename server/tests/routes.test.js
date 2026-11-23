import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createScriptRouter } from '../routes/script.js';

function makeApp(deps) {
  const app = express();
  app.use(express.json());
  app.use('/api/script', createScriptRouter(deps));
  return app;
}

describe('POST /api/script/generate', () => {
  it('空输入 400', async () => {
    const res = await request(makeApp({})).post('/api/script/generate').send({});
    expect(res.status).toBe(400);
  });
  it('澄清时透传 needMoreInfo', async () => {
    const app = makeApp({ generateScript: async () => ({ needMoreInfo: true, question: '请补充人物' }) });
    const res = await request(app).post('/api/script/generate').send({ material: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.needMoreInfo).toBe(true);
    expect(res.body.error).toBe('请补充人物');
  });
  it('成功返回 scriptText', async () => {
    const app = makeApp({ generateScript: async () => ({ needMoreInfo: false, scriptText: '剧本' }) });
    const res = await request(app).post('/api/script/generate').send({ material: 'x' });
    expect(res.body.scriptText).toBe('剧本');
  });
});

describe('POST /api/script/parse', () => {
  it('空输入 400', async () => {
    const res = await request(makeApp({})).post('/api/script/parse').send({});
    expect(res.status).toBe(400);
  });
  it('返回 scriptData', async () => {
    const app = makeApp({ parseScript: async () => ({ summary: 'ok', scenes: [], characters: [], relationships: [] }) });
    const res = await request(app).post('/api/script/parse').send({ scriptText: 'abc' });
    expect(res.status).toBe(200);
    expect(res.body.scriptData.summary).toBe('ok');
  });
});

describe('POST /api/script/extract', () => {
  it('上传 txt 返回文本', async () => {
    const app = makeApp({ extractText: async () => '提取的文本' });
    const res = await request(app)
      .post('/api/script/extract')
      .attach('file', Buffer.from('hi'), 'a.txt');
    expect(res.status).toBe(200);
    expect(res.body.scriptText).toBe('提取的文本');
  });
  it('无文件 400', async () => {
    const res = await request(makeApp({})).post('/api/script/extract');
    expect(res.status).toBe(400);
  });
});
