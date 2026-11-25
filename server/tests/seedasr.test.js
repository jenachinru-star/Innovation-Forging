import { describe, it, expect, beforeEach } from 'vitest';
import { transcribeAudio } from '../services/seedasr.js';

function res(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

describe('SeedASR 转写服务', () => {
  beforeEach(() => {
    process.env.SEEDASR_API_KEY = 'test-key';
    process.env.SEEDASR_RESOURCE_ID = 'volc.seedasr.auc';
  });

  it('submit 后轮询 query 返回识别文本', async () => {
    const calls = [];
    let polls = 0;
    const fetchImpl = async (url) => {
      calls.push(url);
      if (url.includes('/submit')) return res(200, {});
      polls += 1;
      if (polls === 1) return res(200, '{}');
      return res(200, { result: { text: '识别结果' } });
    };
    const text = await transcribeAudio(
      { audioData: 'abc', format: 'webm' },
      { fetchImpl, pollInterval: 1, maxPolls: 5 }
    );
    expect(text).toBe('识别结果');
    expect(calls[0]).toContain('/submit');
  });

  it('缺少音频数据时抛错', async () => {
    await expect(
      transcribeAudio({}, { fetchImpl: async () => res(200, {}), pollInterval: 1 })
    ).rejects.toThrow(/音频/);
  });

  it('query 返回错误码时抛错', async () => {
    const fetchImpl = async (url) => {
      if (url.includes('/submit')) return res(200, {});
      return res(200, { code: 1001, message: '格式不支持' });
    };
    await expect(
      transcribeAudio({ audioData: 'x' }, { fetchImpl, pollInterval: 1 })
    ).rejects.toThrow(/格式不支持/);
  });

  it('轮询超过上限仍无结果时抛超时', async () => {
    const fetchImpl = async (url) => {
      if (url.includes('/submit')) return res(200, {});
      return res(200, '{}');
    };
    await expect(
      transcribeAudio(
        { audioData: 'x' },
        { fetchImpl, pollInterval: 1, maxPolls: 2 }
      )
    ).rejects.toThrow(/超时/);
  });

  it('submit 非 2xx 时抛错', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 401,
      text: async () => 'unauth',
    });
    await expect(
      transcribeAudio({ audioData: 'x' }, { fetchImpl })
    ).rejects.toThrow(/submit 401/);
  });
});
