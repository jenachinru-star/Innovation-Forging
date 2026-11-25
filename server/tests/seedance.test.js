import { describe, it, expect } from 'vitest';
import { createVideoTask, getVideoTask } from '../services/seedance.js';

function jsonRes(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

it('createVideoTask 发送 model/content/ratio/duration 并返回任务 ID', async () => {
  let captured;
  let target;
  const fetchImpl = async (url, opts) => {
    target = url;
    captured = JSON.parse(opts.body);
    return jsonRes(200, { id: 'cgt-1', status: 'queued' });
  };
  const result = await createVideoTask(
    { prompt: '镜头缓缓推进', ratio: '16:9', duration: 5 },
    { fetchImpl }
  );

  expect(result).toEqual({ id: 'cgt-1', status: 'queued' });
  expect(target).toContain('/contents/generations/tasks');
  expect(captured.content).toContainEqual({ type: 'text', text: '镜头缓缓推进' });
  expect(captured.ratio).toBe('16:9');
  expect(captured.duration).toBe(5);
});

it('createVideoTask 带 imageUrl 时追加 image_url 元素', async () => {
  let captured;
  const fetchImpl = async (url, opts) => {
    captured = JSON.parse(opts.body);
    return jsonRes(200, { id: 'cgt-2' });
  };
  await createVideoTask(
    { prompt: '人物转身', imageUrl: 'http://img/a.png' },
    { fetchImpl }
  );
  expect(captured.content).toContainEqual({
    type: 'image_url',
    image_url: { url: 'http://img/a.png' },
  });
});

it('createVideoTask 缺少描述时抛错', async () => {
  await expect(
    createVideoTask({ prompt: '   ' }, { fetchImpl: async () => jsonRes(200, {}) })
  ).rejects.toThrow();
});

it('createVideoTask 上游非 2xx 时抛错', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 400,
    text: async () => 'bad request',
    json: async () => ({}),
  });
  await expect(createVideoTask({ prompt: 'x' }, { fetchImpl })).rejects.toThrow(
    /Seedance API 400/
  );
});

it('getVideoTask 返回状态与视频地址', async () => {
  let target;
  const fetchImpl = async (url) => {
    target = url;
    return jsonRes(200, {
      id: 'cgt-1',
      status: 'succeeded',
      content: { video_url: 'http://v/1.mp4' },
    });
  };
  const task = await getVideoTask('cgt-1', { fetchImpl });
  expect(target).toContain('/tasks/cgt-1');
  expect(task.status).toBe('succeeded');
  expect(task.videoUrl).toBe('http://v/1.mp4');
});

it('getVideoTask 失败状态保留错误信息', async () => {
  const fetchImpl = async () =>
    jsonRes(200, { id: 'cgt-9', status: 'failed', error: '内容不合规' });
  const task = await getVideoTask('cgt-9', { fetchImpl });
  expect(task.status).toBe('failed');
  expect(task.error).toBe('内容不合规');
});
