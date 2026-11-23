import { describe, it, expect } from 'vitest';
import { findImpacts } from '@director/shared/rules/impact.js';

const prevData = {
  scenes: [
    { sceneNumber: 1, lines: [{ text: '你终于回来了。' }], stageDirections: ['灯亮'] },
  ],
};

const cues = [
  { id: 'cue-1', trigger: { quote: '你终于回来了。' } },
  { id: 'cue-2', trigger: { quote: '' } },
];

describe('findImpacts', () => {
  it('删除绑定台词后返回 cue 类影响，状态为 open', () => {
    const nextData = {
      scenes: [
        { sceneNumber: 1, lines: [{ text: '爸，我回来了。' }], stageDirections: ['灯亮'] },
      ],
    };

    const impacts = findImpacts({ prevData, nextData, cues, briefs: [] });

    expect(impacts).toHaveLength(1);
    expect(impacts[0].id).toBe('imp-1');
    expect(impacts[0].target).toEqual({ kind: 'cue', refId: 'cue-1' });
    expect(impacts[0].change).toEqual({
      kind: 'script',
      refId: 'cue-1',
      description: '绑定台词已不存在',
    });
    expect(impacts[0].status).toBe('open');
    expect(impacts[0].reason).toBe('该提示绑定的台词在新版剧本中已不存在');
  });

  it('绑定台词仍在时不返回影响', () => {
    const nextData = {
      scenes: [
        { sceneNumber: 1, lines: [{ text: '你终于回来了。' }], stageDirections: [] },
      ],
    };

    const impacts = findImpacts({ prevData, nextData, cues, briefs: [] });

    expect(impacts).toEqual([]);
  });

  it('brief.cueId 指向的 cue 不存在时返回 brief 类影响', () => {
    const nextData = {
      scenes: [
        { sceneNumber: 1, lines: [{ text: '你终于回来了。' }], stageDirections: [] },
      ],
    };
    const briefs = [{ id: 'brief-1', cueId: 'cue-gone' }];

    const impacts = findImpacts({ prevData, nextData, cues, briefs });

    expect(impacts).toHaveLength(1);
    expect(impacts[0].target).toEqual({ kind: 'brief', refId: 'brief-1' });
    expect(impacts[0].status).toBe('open');
  });
});
