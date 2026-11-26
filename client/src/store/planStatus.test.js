import { describe, it, expect } from 'vitest';
import { createPlan, planReducer } from './plan.js';
import { BRIEF_STATUS, IMPACT_STATUS } from '@director/shared/constants/status.js';

describe('planReducer 状态流转守卫', () => {
  it('updateBrief 合法状态跳转放行', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addBrief',
      brief: { sceneId: 'sc-1', sceneNumber: 1, original: 'a' },
    });
    const updated = planReducer(next, {
      type: 'updateBrief',
      id: next.briefs[0].id,
      patch: { status: BRIEF_STATUS.SUBMITTED },
    });
    expect(updated.briefs[0].status).toBe(BRIEF_STATUS.SUBMITTED);
  });

  it('updateBrief 非法状态跳转被拒绝，保留原值', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addBrief',
      brief: { sceneId: 'sc-1', sceneNumber: 1, original: 'a' },
    });
    const updated = planReducer(next, {
      type: 'updateBrief',
      id: next.briefs[0].id,
      patch: { status: BRIEF_STATUS.CONFIRMED },
    });
    expect(updated.briefs[0].status).toBe(BRIEF_STATUS.DRAFT);
  });

  it('updateBrief 非 status patch 不受影响', () => {
    const state = createPlan('stage', '方案');
    const next = planReducer(state, {
      type: 'addBrief',
      brief: { sceneId: 'sc-1', sceneNumber: 1, original: 'a' },
    });
    const updated = planReducer(next, {
      type: 'updateBrief',
      id: next.briefs[0].id,
      patch: { owner: '导演' },
    });
    expect(updated.briefs[0].owner).toBe('导演');
    expect(updated.briefs[0].status).toBe(BRIEF_STATUS.DRAFT);
  });

  it('resolveImpact 合法状态跳转放行', () => {
    const state = {
      ...createPlan('stage', '方案'),
      impacts: [{ id: 'impact-1', status: IMPACT_STATUS.OPEN }],
    };
    const next = planReducer(state, {
      type: 'resolveImpact',
      id: 'impact-1',
      status: IMPACT_STATUS.ACCEPTED,
    });
    expect(next.impacts[0].status).toBe(IMPACT_STATUS.ACCEPTED);
  });

  it('resolveImpact 非法状态跳转被拒绝，保留原值', () => {
    const state = {
      ...createPlan('stage', '方案'),
      impacts: [{ id: 'impact-1', status: IMPACT_STATUS.ACCEPTED }],
    };
    const next = planReducer(state, {
      type: 'resolveImpact',
      id: 'impact-1',
      status: IMPACT_STATUS.OPEN,
    });
    expect(next.impacts[0].status).toBe(IMPACT_STATUS.ACCEPTED);
  });
});