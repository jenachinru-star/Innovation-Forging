import { describe, it, expect } from 'vitest';
import { buildTodos } from '@director/shared/rules/todos.js';

describe('buildTodos', () => {
  it('待核实需求与待处理影响排在前面', () => {
    const todos = buildTodos({
      briefs: [{ status: 'needsReview' }],
      impacts: [{ status: 'open' }],
      style: { id: 's1' },
    });
    expect(todos.map((t) => t.id)).toEqual(['briefs', 'rehearsal']);
  });

  it('无视觉方向时加入确定视觉方向', () => {
    const todos = buildTodos({ briefs: [], impacts: [] });
    expect(todos.some((t) => t.id === 'visuals')).toBe(true);
  });

  it('没有具体待办时兜底引导确认走位', () => {
    const todos = buildTodos({
      briefs: [{ status: 'confirmed' }],
      impacts: [{ status: 'resolved' }],
      style: { id: 's1' },
    });
    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe('stage');
  });

  it('空输入安全返回兜底待办', () => {
    expect(buildTodos(null)[0].id).toBe('visuals');
  });
});
