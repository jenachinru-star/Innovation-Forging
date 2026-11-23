import { describe, it, expect } from 'vitest';
import { createPlan, planReducer } from './plan.js';

describe('createPlan', () => {
  it('创建空的舞台制作方案', () => {
    const plan = createPlan('stage', '我的舞台方案');
    expect(plan.type).toBe('stage');
    expect(plan.name).toBe('我的舞台方案');
    expect(plan.segments).toEqual([]);
    expect(plan.cues).toEqual([]);
    expect(plan.briefs).toEqual([]);
    expect(plan.impacts).toEqual([]);
  });
});

describe('planReducer', () => {
  it('addCue 追加草稿状态的提示点', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addCue',
      cue: { department: 'lighting', sceneId: 'sc-1', content: '面光渐亮' },
    });

    expect(next.cues).toHaveLength(1);
    expect(next.cues[0].status).toBe('draft');
    expect(next.cues[0].content).toBe('面光渐亮');
    expect(next).not.toBe(state);
    expect(state.cues).toHaveLength(0);
  });

  it('removeCue 移除提示点并把引用它的 brief.cueId 置为 null', () => {
    const state = {
      ...createPlan('stage', '方案'),
      cues: [
        { id: 'cue-1', department: 'lighting', status: 'draft', content: 'x' },
        { id: 'cue-2', department: 'music', status: 'draft', content: 'y' },
      ],
      briefs: [
        { id: 'brief-1', cueId: 'cue-1', department: 'lighting', original: 'a' },
        { id: 'brief-2', cueId: 'cue-2', department: 'music', original: 'b' },
      ],
    };

    const next = planReducer(state, { type: 'removeCue', id: 'cue-1' });

    expect(next.cues).toHaveLength(1);
    expect(next.briefs[0].cueId).toBeNull();
    expect(next.briefs[1].cueId).toBe('cue-2');
    expect(state.briefs[0].cueId).toBe('cue-1');
  });

  it('resolveImpact 按状态更新影响记录', () => {
    const state = {
      ...createPlan('stage', '方案'),
      impacts: [{ id: 'impact-1', status: 'open', reason: '台词已删除' }],
    };

    const next = planReducer(state, { type: 'resolveImpact', id: 'impact-1', status: 'accepted' });

    expect(next.impacts[0].status).toBe('accepted');
    expect(state.impacts[0].status).toBe('open');
  });
});
