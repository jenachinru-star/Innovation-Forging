import { describe, it, expect } from 'vitest';
import { enrichBreakdown } from '@director/shared/rules/breakdown.js';

function makeData(overrides = {}) {
  return {
    summary: '',
    scenes: [],
    characters: [],
    relationships: [],
    acts: [],
    meta: { source: 'upload', importedAt: '', parser: 'offline' },
    ...overrides,
  };
}

function makeScene(overrides = {}) {
  return {
    id: 'sc-1',
    sceneNumber: 1,
    title: '第一场',
    location: '门口',
    characters: [],
    presentCharacters: [],
    props: [],
    stageDirections: [],
    summary: '',
    estimatedMinutes: 2,
    rawRange: null,
    actId: null,
    ...overrides,
  };
}

describe('enrichBreakdown', () => {
  it('舞台说明中出现但无台词的角色补进在场人物', () => {
    const input = makeData({
      characters: [
        { id: 'ch-阿岚', name: '阿岚', description: '', aliases: [] },
        { id: 'ch-老周', name: '老周', description: '', aliases: ['周叔'] },
      ],
      scenes: [
        makeScene({
          stageDirections: ['（阿岚站在门边）'],
        }),
      ],
    });

    const out = enrichBreakdown(input);

    expect(out.scenes[0].presentCharacters).toContain('阿岚');
    expect(out.scenes[0].presentCharacters).not.toContain('老周');
  });

  it('已在场的人物不重复，顺序保持原样', () => {
    const input = makeData({
      characters: [{ id: 'ch-阿岚', name: '阿岚', description: '', aliases: [] }],
      scenes: [
        makeScene({
          presentCharacters: ['阿岚'],
          stageDirections: ['（阿岚站在门边）'],
        }),
      ],
    });

    const out = enrichBreakdown(input);

    expect(out.scenes[0].presentCharacters).toEqual(['阿岚']);
  });

  it('用别名匹配舞台说明', () => {
    const input = makeData({
      characters: [{ id: 'ch-老周', name: '老周', description: '', aliases: ['周叔'] }],
      scenes: [
        makeScene({
          stageDirections: ['（周叔拎着菜从楼梯上来）'],
        }),
      ],
    });

    const out = enrichBreakdown(input);

    expect(out.scenes[0].presentCharacters).toContain('老周');
  });

  it('返回新对象，不修改原数据', () => {
    const input = makeData({
      characters: [{ id: 'ch-阿岚', name: '阿岚', description: '', aliases: [] }],
      scenes: [makeScene({ stageDirections: ['（阿岚站在门边）'] })],
    });

    const out = enrichBreakdown(input);

    expect(out).not.toBe(input);
    expect(out.scenes[0]).not.toBe(input.scenes[0]);
    expect(input.scenes[0].presentCharacters).toEqual([]);
  });
});
