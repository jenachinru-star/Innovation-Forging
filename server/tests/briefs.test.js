import { describe, it, expect } from 'vitest';
import { splitBrief } from '@director/shared/rules/briefs.js';

describe('splitBrief', () => {
  it('按部门拆分并保留原话', () => {
    const out = splitBrief('这里想更暖一点，加个定点，面光弱一些；音乐渐入，加点雨声；声音加混响');
    const depts = out.map((b) => b.department);
    expect(depts).toContain('lighting');
    expect(depts).toContain('music');
    expect(depts).toContain('sound');
    expect(out.every((b) => b.original.length > 0)).toBe(true);
  });

  it('无法归类进待确认', () => {
    expect(splitBrief('就是那种说不清的感觉').some((b) => b.uncertain.length > 0)).toBe(true);
  });
});
