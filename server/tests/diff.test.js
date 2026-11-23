import { describe, it, expect } from 'vitest';
import { diffScriptData } from '@director/shared/diff.js';

const a = { scenes: [{ title: '第一场', summary: '旧' }, { title: '第二场', summary: '同' }], characters: [{ name: '甲' }] };
const b = { scenes: [{ title: '第一场', summary: '新' }, { title: '第三场', summary: '加' }], characters: [{ name: '甲' }, { name: '乙' }] };

describe('diffScriptData', () => {
  it('识别新增/删除/改动/人物变化', () => {
    const d = diffScriptData(a, b);
    expect(d.addedScenes).toEqual(['第三场']);
    expect(d.removedScenes).toEqual(['第二场']);
    expect(d.changedScenes[0]).toEqual({ title: '第一场', from: '旧', to: '新' });
    expect(d.characterDelta.added).toEqual(['乙']);
    expect(d.characterDelta.removed).toEqual([]);
  });
});
