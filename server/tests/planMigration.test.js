import { describe, it, expect } from 'vitest';
import { migratePlan } from '@director/shared/migration/plan.js';

describe('migratePlan', () => {
  it('把 cues 与 briefs 中的 music/sound 合并为 musicSound', () => {
    const plan = {
      cues: [
        { id: 'c1', department: 'music' },
        { id: 'c2', department: 'sound' },
        { id: 'c3', department: 'lighting' },
      ],
      briefs: [
        { id: 'b1', department: 'music' },
        { id: 'b2', department: 'scenery' },
      ],
    };
    const out = migratePlan(plan);
    expect(out.cues.map((c) => c.department)).toEqual([
      'musicSound',
      'musicSound',
      'lighting',
    ]);
    expect(out.briefs.map((b) => b.department)).toEqual(['musicSound', 'scenery']);
  });

  it('幂等：重复迁移结果不变', () => {
    const plan = { cues: [{ id: 'c1', department: 'musicSound' }], briefs: [] };
    const once = migratePlan(plan);
    const twice = migratePlan(once);
    expect(twice).toEqual(once);
  });

  it('空部门回退为 lighting，非法输入安全返回', () => {
    expect(migratePlan({ cues: [{ id: 'c1' }], briefs: [] }).cues[0].department).toBe(
      'lighting'
    );
    expect(migratePlan(null)).toBeNull();
  });
});
