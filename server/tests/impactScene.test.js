import { describe, it, expect } from 'vitest';
import { findImpacts } from '@director/shared/rules/impact.js';

describe('findImpacts 版本 diff：删除场次', () => {
  it('cue 关联场次被删除时返回 cue 类场次影响', () => {
    const prevData = { scenes: [{ sceneNumber: 1, title: '第一场' }] };
    const nextData = { scenes: [] };
    const cues = [{ id: 'cue-1', sceneNumber: 1, trigger: { quote: '' } }];

    const impacts = findImpacts({ prevData, nextData, cues, briefs: [] });

    expect(impacts).toHaveLength(1);
    expect(impacts[0].target).toEqual({ kind: 'cue', refId: 'cue-1' });
    expect(impacts[0].change).toEqual({ kind: 'script', refId: 'cue-1', description: '关联场次已删除' });
    expect(impacts[0].status).toBe('open');
  });

  it('brief 关联场次被删除时返回 brief 类场次影响', () => {
    const prevData = { scenes: [{ sceneNumber: 2 }] };
    const nextData = { scenes: [] };
    const cues = [];
    const briefs = [{ id: 'brief-1', sceneNumber: 2 }];

    const impacts = findImpacts({ prevData, nextData, cues, briefs });

    expect(impacts).toHaveLength(1);
    expect(impacts[0].target).toEqual({ kind: 'brief', refId: 'brief-1' });
    expect(impacts[0].change.description).toBe('关联场次已删除');
  });

  it('场次无变化时不返回场次影响', () => {
    const prevData = { scenes: [{ sceneNumber: 1 }] };
    const nextData = { scenes: [{ sceneNumber: 1 }] };
    const cues = [{ id: 'cue-1', sceneNumber: 1, trigger: { quote: '' } }];

    expect(findImpacts({ prevData, nextData, cues, briefs: [] })).toEqual([]);
  });

  it('删除台词与删除场次同时发生，返回两条影响', () => {
    const prevData = { scenes: [{ sceneNumber: 1, lines: [{ text: '你走了。' }] }] };
    const nextData = { scenes: [] };
    const cues = [{ id: 'cue-1', sceneNumber: 1, trigger: { quote: '你走了。' } }];

    const impacts = findImpacts({ prevData, nextData, cues, briefs: [] });

    expect(impacts).toHaveLength(2);
    expect(impacts[0].change.description).toBe('绑定台词已不存在');
    expect(impacts[1].change.description).toBe('关联场次已删除');
  });
});