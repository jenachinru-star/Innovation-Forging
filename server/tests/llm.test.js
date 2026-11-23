import { describe, it, expect } from 'vitest';
import { generateScript, withRetry } from '../services/llm.js';

describe('withRetry', () => {
  it('失败一次后成功', async () => {
    let n = 0;
    const out = await withRetry(async () => {
      n += 1;
      if (n < 2) throw new Error('x');
      return 'ok';
    }, 2);
    expect(out).toBe('ok');
    expect(n).toBe(2);
  });

  it('耗尽重试后抛出（初始+2次=3次调用）', async () => {
    let n = 0;
    await expect(
      withRetry(async () => { n += 1; throw new Error('boom'); }, 2)
    ).rejects.toThrow('boom');
    expect(n).toBe(3);
  });
});

describe('generateScript', () => {
  it('识别 NEED_MORE_INFO 反问', async () => {
    const chat = async () => 'NEED_MORE_INFO: 请告诉我人物名字和关系';
    const r = await generateScript('随便一点', { chat });
    expect(r.needMoreInfo).toBe(true);
    expect(r.question).toContain('人物名字');
  });

  it('返回剧本文本', async () => {
    const chat = async () => '第一场\n老陈：你好。';
    const r = await generateScript('素材', { chat });
    expect(r.needMoreInfo).toBe(false);
    expect(r.scriptText).toBe('第一场\n老陈：你好。');
  });
});
