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

import { safeParseScriptData, parseScript } from '../services/llm.js';

describe('safeParseScriptData', () => {
  it('解析干净 JSON', () => {
    const r = safeParseScriptData('{"summary":"s","scenes":[],"characters":[],"relationships":[]}');
    expect(r.summary).toBe('s');
  });

  it('从夹带文字/代码块中提取 JSON', () => {
    const r = safeParseScriptData('好的，结果如下：\n```json\n{"summary":"s2"}\n```\n希望有帮助');
    expect(r.summary).toBe('s2');
  });

  it('完全无 JSON 返回 null', () => {
    expect(safeParseScriptData('完全不是JSON')).toBe(null);
  });
});

describe('parseScript', () => {
  it('返回归一化后的 ScriptData', async () => {
    const chat = async () =>
      '{"summary":"s","scenes":[{"sceneNumber":1,"characters":["甲"],"estimatedMinutes":3}],"characters":[{"name":"甲"}],"relationships":[]}';
    const r = await parseScript('剧本文本', { chat });
    expect(r.summary).toBe('s');
    expect(r.scenes[0].sceneNumber).toBe(1);
    expect(r.relationships).toEqual([]);
  });

  it('首次输出非法 JSON 时会重试并最终成功', async () => {
    let n = 0;
    const chat = async () => {
      n += 1;
      if (n === 1) return '这不是JSON';
      return '{"summary":"可解析","scenes":[],"characters":[],"relationships":[]}';
    };
    const r = await parseScript('剧本文本', { chat });
    expect(r.summary).toBe('可解析');
  });

  it('jsonMode 抛错时回退纯文本解析', async () => {
    const chat = async (msgs, opts) => {
      if (opts?.jsonMode) throw new Error('jsonMode unsupported');
      return '{"summary":"回退成功","scenes":[],"characters":[],"relationships":[]}';
    };
    const r = await parseScript('剧本文本', { chat });
    expect(r.summary).toBe('回退成功');
  });
});
