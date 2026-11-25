import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createVisualRouter } from '../routes/visual.js';

function buildApp(generate) {
  const app = express();
  app.use(express.json());
  app.use('/api/visual', createVisualRouter({ generateVisualImage: generate }));
  return app;
}

describe('visual 路由', () => {
  it('缺少描述时返回 400', async () => {
    const res = await request(buildApp(async () => 'http://img/x.png'))
      .post('/api/visual/generate')
      .send({ styleName: '自然诗意' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('描述');
  });

  it('成功时返回图片 URL，且提示词含风格与描述', async () => {
    let receivedPrompt;
    const generate = async (prompt, opts) => {
      receivedPrompt = prompt;
      return 'http://img/ok.png';
    };
    const res = await request(buildApp(generate))
      .post('/api/visual/generate')
      .send({ styleName: '自然诗意', description: '黄昏下的老戏台' });

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toBe('http://img/ok.png');
    expect(receivedPrompt).toContain('自然诗意');
    expect(receivedPrompt).toContain('黄昏下的老戏台');
  });

  it('生成服务抛错时返回 502 友好错误', async () => {
    const res = await request(buildApp(async () => {
      throw new Error('Seedream 请求超时');
    }))
      .post('/api/visual/generate')
      .send({ description: '雨夜小巷' });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('生成失败');
  });
});
