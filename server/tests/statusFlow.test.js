import { describe, it, expect } from 'vitest';
import { assertStatusTransition, nextStatusOptions } from '@director/shared/rules/statusFlow.js';
import { BRIEF_STATUS, CUE_STATUS, IMPACT_STATUS } from '@director/shared/constants/status.js';

describe('assertStatusTransition', () => {
  it('合法流转放行', () => {
    expect(assertStatusTransition('brief', BRIEF_STATUS.DRAFT, BRIEF_STATUS.SUBMITTED)).toEqual({
      ok: true,
      error: null,
    });
  });

  it('非法流转拒绝并携带原因', () => {
    const r = assertStatusTransition('brief', BRIEF_STATUS.DRAFT, BRIEF_STATUS.CONFIRMED);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('draft');
    expect(r.error).toContain('confirmed');
  });

  it('自转合法', () => {
    expect(assertStatusTransition('cue', CUE_STATUS.DRAFT, CUE_STATUS.DRAFT).ok).toBe(true);
  });

  it('终态不能再转出', () => {
    expect(assertStatusTransition('impact', IMPACT_STATUS.ACCEPTED, IMPACT_STATUS.OPEN).ok).toBe(false);
  });

  it('未知 kind 不拦截', () => {
    expect(assertStatusTransition('unknown', 'a', 'b').ok).toBe(true);
  });
});

describe('nextStatusOptions', () => {
  it('含当前值与合法下一状态，排除非法项', () => {
    const opts = nextStatusOptions('brief', BRIEF_STATUS.DRAFT);
    expect(opts).toContain(BRIEF_STATUS.DRAFT);
    expect(opts).toContain(BRIEF_STATUS.SUBMITTED);
    expect(opts).toContain(BRIEF_STATUS.NEEDS_REVIEW);
    expect(opts).not.toContain(BRIEF_STATUS.CONFIRMED);
  });

  it('未知 kind 返回空数组', () => {
    expect(nextStatusOptions('nope', 'x')).toEqual([]);
  });
});