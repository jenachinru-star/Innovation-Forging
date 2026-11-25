import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createDiscussionRouter } from '../routes/discussion.js';

function buildApp(deps) {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use('/api/discussion', createDiscussionRouter(deps));
  return app;
}

const summary = { overview: 'o', decisions: ['d'], todos: [], changes: [], questions: [] };

it('文字分析成功返回 transcript 与 summary', async () => {
  const summarizeDiscussion = async (text) => {
    expect(text).toBe('讨论内容');
    return summary;
  };
  const res = await request(buildApp({ summarizeDiscussion }))
    .post('/api/discussion/analyze')
    .send({ kind: 'text', text: '讨论内容' });
  expect(res.status).toBe(200);
  expect(res.body.transcript).toBe('讨论内容');
  expect(res.body.summary.decisions).toEqual(['d']);
});

it('文字为空返回 400', async () => {
  const res = await request(buildApp())
    .post('/api/discussion/analyze')
    .send({ kind: 'text', text: '   ' });
  expect(res.status).toBe(400);
});

it('音频分析先转写再纪要', async () => {
  const order = [];
  const transcribeAudio = async ({ audioData, format }) => {
    order.push('tr');
    expect(audioData).toBe('BASE64');
    expect(format).toBe('webm');
    return '转写文本';
  };
  const summarizeDiscussion = async (text) => {
    order.push('sm');
    expect(text).toBe('转写文本');
    return summary;
  };
  const res = await request(buildApp({ transcribeAudio, summarizeDiscussion }))
    .post('/api/discussion/analyze')
    .send({ kind: 'audio', audioData: 'BASE64', audioFormat: 'audio/webm;codecs=opus' });
  expect(res.status).toBe(200);
  expect(res.body.transcript).toBe('转写文本');
  expect(order).toEqual(['tr', 'sm']);
});

it('音频缺数据返回 400', async () => {
  const res = await request(buildApp())
    .post('/api/discussion/analyze')
    .send({ kind: 'audio' });
  expect(res.status).toBe(400);
});

it('服务抛错返回 502', async () => {
  const summarizeDiscussion = async () => {
    throw new Error('boom');
  };
  const res = await request(buildApp({ summarizeDiscussion }))
    .post('/api/discussion/analyze')
    .send({ kind: 'text', text: 'x' });
  expect(res.status).toBe(502);
});
