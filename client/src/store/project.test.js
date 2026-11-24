import { describe, it, expect, beforeEach } from 'vitest';
import {
  deleteProjectRecord,
  listProjectRecords,
  loadProjectRecord,
  saveProject,
  loadProject,
  clearProject,
  isPersistent,
  saveProjectRecord,
} from './project.js';

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

  it('保存、枚举、读取并删除本地作品记录', async () => {
    const first = { id: 'p-1', name: '第一场雨', updatedAt: '2026-11-24T10:00:00.000Z' };
    const second = { id: 'p-2', name: '旧钥匙', updatedAt: '2026-11-24T11:00:00.000Z' };
    await saveProjectRecord(first);
    await saveProjectRecord(second);

    expect((await listProjectRecords()).map((item) => item.id)).toEqual(
      expect.arrayContaining(['p-1', 'p-2'])
    );
    await expect(loadProjectRecord('p-1')).resolves.toEqual(first);

    await deleteProjectRecord('p-1');
    await expect(loadProjectRecord('p-1')).resolves.toBeNull();
  });
});
