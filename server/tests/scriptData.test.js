import { describe, it, expect } from 'vitest';
import {
  normalizeScriptData,
  createEmptyScriptData,
} from '@director/shared';

describe('normalizeScriptData', () => {
  it('null 返回空结构', () => {
    expect(normalizeScriptData(null)).toEqual(createEmptyScriptData());
  });

  it('强制转换字段与数组', () => {
    const out = normalizeScriptData({
      summary: 'x',
      scenes: [{
        sceneNumber: '2',
        location: '客厅',
        characters: '老王',
        props: null,
        estimatedMinutes: '5',
      }],
      characters: [{ name: '老王' }],
      relationships: [{ from: 'a', to: 'b', relation: 'friends', needsReview: 1 }],
    });
    expect(out.scenes[0].sceneNumber).toBe(2);
    expect(out.scenes[0].characters).toEqual(['老王']);
    expect(out.scenes[0].props).toEqual([]);
    expect(out.scenes[0].estimatedMinutes).toBe(5);
    expect(out.relationships[0].needsReview).toBe(true);
  });
});
