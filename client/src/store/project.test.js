import { describe, it, expect, beforeEach } from 'vitest';
import { saveProject, loadProject, clearProject, isPersistent } from './project.js';

describe('project store', () => {
  beforeEach(async () => {
    globalThis.indexedDB = undefined;
    await clearProject();
  });

  it('indexedDB 不存在时降级内存且 isPersistent() 为 false', async () => {
    expect(typeof indexedDB).toBe('undefined');
    expect(isPersistent()).toBe(false);
    await expect(saveProject({ step: 'input' })).resolves.toBeDefined();
  });

  it('saveProject 与 loadProject 往返一致', async () => {
    const state = {
      step: 'result',
      scriptText: '剧本正文',
      scriptData: { summary: '简介', scenes: [] },
      plan: { name: '雨夜重逢方案', cues: [] },
    };

    await saveProject(state);
    await expect(loadProject()).resolves.toEqual(state);
  });

  it('clearProject 后 loadProject 返回 null', async () => {
    await saveProject({ step: 'confirm' });
    await clearProject();
    await expect(loadProject()).resolves.toBeNull();
  });
});
