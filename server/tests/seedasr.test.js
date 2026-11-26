import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { transcribeAudio } from '../services/seedasr.js';

function res(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

describe('语音转写服务（Whisper multipart）', () => {
  beforeEach(() => {
    process.env.OPENAI_NEXT_API_KEY = 'test-key';
    process.env.ASR_MODEL = 'whisper-1';
  });

  afterEach(() => {
    delete process.env.OPENAI_NEXT_API_KEY;
    delete process.env.ASR_MODEL;
  });

  it('multipart 上传音频并返回识别文本', async () => {
    let target;
    let form;
    const fetchImpl = async (url, opts) => {
      target = url;
      form = opts.body;
      return res(200, { text: '识别结果' });
    };
    const text = await transcribeAudio(
      { audioData: Buffer.from('hello').toString('base64'), format: 'webm' },
      { fetchImpl }
    );
    expect(text).toBe('识别结果');
    expect(target).toContain('/audio/transcriptions');
    expect(form.get('model')).toBe('whisper-1');
    const file = form.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect(file.size).toBeGreaterThan(0);
  });

  it('缺少音频数据时抛错', async () => {
    await expect(
      transcribeAudio({}, { fetchImpl: async () => res(200, {}) })
    ).rejects.toThrow(/音频/);
  });

  it('上游非 2xx 时抛错', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 401,
      text: async () => 'unauth',
      json: async () => ({}),
    });
    await expect(
      transcribeAudio({ audioData: 'x' }, { fetchImpl })
    ).rejects.toThrow(/语音转写 API 401/);
  });

  it('响应缺少文本时抛错', async () => {
    const fetchImpl = async () => res(200, {});
    await expect(
      transcribeAudio({ audioData: 'x' }, { fetchImpl })
    ).rejects.toThrow(/未返回文本/);
  });
});
