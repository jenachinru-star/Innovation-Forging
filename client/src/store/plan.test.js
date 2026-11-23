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
  it('addCue 追加草稿状态的提示点并保留 sceneNumber', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addCue',
      cue: { department: 'lighting', sceneId: 'sc-1', sceneNumber: 1, content: '面光渐亮' },
    });

    expect(next.cues).toHaveLength(1);
    expect(next.cues[0].status).toBe('draft');
    expect(next.cues[0].content).toBe('面光渐亮');
    expect(next.cues[0].sceneId).toBe('sc-1');
    expect(next.cues[0].sceneNumber).toBe(1);
    expect(next).not.toBe(state);
    expect(state.cues).toHaveLength(0);
  });

  it('addCue 缺少 sceneNumber 时从 sceneId 推导，sceneId 缺失时为空串', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addCue',
      cue: { department: 'music', sceneId: 'sc-7', content: '音乐起' },
    });

    expect(next.cues[0].sceneNumber).toBe(7);
    expect(next.cues[0].sceneId).toBe('sc-7');

    const withoutScene = planReducer(state, {
      type: 'addCue',
      cue: { department: 'music', content: '无场次' },
    });
    expect(withoutScene.cues[0].sceneNumber).toBeNull();
    expect(withoutScene.cues[0].sceneId).toBe('');
  });

  it('addBrief 保留 sceneNumber', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addBrief',
      brief: { department: 'lighting', sceneId: 'sc-2', sceneNumber: 2, original: '加定点' },
    });

    expect(next.briefs[0].sceneNumber).toBe(2);
    expect(next.briefs[0].sceneId).toBe('sc-2');
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

  it('setPlacement 按 sceneNumber + characterId 覆盖而不重复新增', () => {
    let state = createPlan('stage', '方案');
    state = planReducer(state, {
      type: 'setPlacement',
      placement: { sceneNumber: 1, characterId: '老陈', x: 10, y: 20 },
    });
    state = planReducer(state, {
      type: 'setPlacement',
      placement: { sceneNumber: 1, characterId: '老陈', x: 30, y: 40 },
    });

    expect(state.staging.placements).toHaveLength(1);
    expect(state.staging.placements[0]).toMatchObject({
      sceneNumber: 1,
      characterId: '老陈',
      x: 30,
      y: 40,
    });

    state = planReducer(state, {
      type: 'setPlacement',
      placement: { sceneNumber: 2, characterId: '老陈', x: 50, y: 60 },
    });
    expect(state.staging.placements).toHaveLength(2);
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

  it('addImpact 对相同 target 的 open 影响去重', () => {
    const state = {
      ...createPlan('stage', '方案'),
      impacts: [
        {
          id: 'impact-1',
          status: 'open',
          target: { kind: 'cue', refId: 'cue-1' },
        },
      ],
    };

    const duplicate = planReducer(state, {
      type: 'addImpact',
      impact: {
        id: 'impact-2',
        target: { kind: 'cue', refId: 'cue-1' },
        reason: '重复',
      },
    });
    expect(duplicate.impacts).toHaveLength(1);
    expect(duplicate).toBe(state);

    const distinct = planReducer(state, {
      type: 'addImpact',
      impact: {
        id: 'impact-3',
        target: { kind: 'cue', refId: 'cue-2' },
        reason: '另一条',
      },
    });
    expect(distinct.impacts).toHaveLength(2);
  });

  it('addImpact 在已有同 target 但已解决时仍允许新增', () => {
    const state = {
      ...createPlan('stage', '方案'),
      impacts: [
        {
          id: 'impact-1',
          status: 'accepted',
          target: { kind: 'cue', refId: 'cue-1' },
        },
      ],
    };

    const next = planReducer(state, {
      type: 'addImpact',
      impact: { target: { kind: 'cue', refId: 'cue-1' }, reason: '再次出现' },
    });
    expect(next.impacts).toHaveLength(2);
  });

  it('setRehearsalNotes 把整理结果写入第一条排练记录并在缺失时创建', () => {
    const state = createPlan('stage', '方案');
    const payload = {
      notes: '开场先暗场\n灯什么时候亮？\n#确认钥匙位置',
      decisions: ['开场先暗场'],
      openQuestions: ['灯什么时候亮？'],
      todos: [{ text: '确认钥匙位置', done: false }],
    };

    const next = planReducer(state, { type: 'setRehearsalNotes', payload });

    expect(next.rehearsals).toHaveLength(1);
    expect(next.rehearsals[0].id).toBe('reh-1');
    expect(next.rehearsals[0].notes).toBe(payload.notes);
    expect(next.rehearsals[0].decisions).toEqual(['开场先暗场']);
    expect(next.rehearsals[0].openQuestions).toEqual(['灯什么时候亮？']);
    expect(next.rehearsals[0].todos).toEqual([{ text: '确认钥匙位置', done: false }]);

    const again = planReducer(next, {
      type: 'setRehearsalNotes',
      payload: { ...payload, decisions: ['改主意'] },
    });
    expect(again.rehearsals).toHaveLength(1);
    expect(again.rehearsals[0].id).toBe('reh-1');
    expect(again.rehearsals[0].decisions).toEqual(['改主意']);
  });
});
