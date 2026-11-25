import { describe, it, expect } from 'vitest';
import { diffScriptData, diffLines, buildSplitRows } from '@director/shared/diff.js';

const a = { scenes: [{ title: '第一场', summary: '旧' }, { title: '第二场', summary: '同' }], characters: [{ name: '甲' }] };
const b = { scenes: [{ title: '第一场', summary: '新' }, { title: '第三场', summary: '加' }], characters: [{ name: '甲' }, { name: '乙' }] };

describe('diffScriptData', () => {
  it('识别新增/删除/改动/人物变化', () => {
    const d = diffScriptData(a, b);
    expect(d.addedScenes).toEqual(['第三场']);
    expect(d.removedScenes).toEqual(['第二场']);
    expect(d.changedScenes[0]).toEqual({ title: '第一场', from: '旧', to: '新' });
    expect(d.characterDelta.added).toEqual(['乙']);
    expect(d.characterDelta.removed).toEqual([]);
  });

  it('场景按稳定 id 匹配，标题变化仍判为同一场景', () => {
    const old = { scenes: [{ id: 'uuid-1', title: '书房', summary: '旧' }], characters: [] };
    const next = { scenes: [{ id: 'uuid-1', title: '客厅', summary: '新' }], characters: [] };
    const d = diffScriptData(old, next);
    expect(d.addedScenes).toEqual([]);
    expect(d.removedScenes).toEqual([]);
    expect(d.changedScenes).toEqual([{ title: '书房', from: '旧', to: '新' }]);
  });

  it('角色按稳定 id 匹配，名字变化仍判为同一角色', () => {
    const old = { scenes: [], characters: [{ id: 'c-1', name: '甲' }] };
    const next = { scenes: [], characters: [{ id: 'c-1', name: '甲乙' }] };
    const d = diffScriptData(old, next);
    expect(d.characterDelta.added).toEqual([]);
    expect(d.characterDelta.removed).toEqual([]);
  });
});

describe('diffLines 行级 diff', () => {
  it('标记相同、新增与删除行', () => {
    const ops = diffLines('a\nb\nc', 'a\nx\nc');
    const kinds = ops.map((o) => o.op);
    expect(kinds).toEqual(['equal', 'remove', 'add', 'equal']);
    expect(ops.find((o) => o.op === 'add').text).toBe('x');
  });

  it('完全相同则全部 equal', () => {
    const ops = diffLines('一\n二', '一\n二');
    expect(ops.every((o) => o.op === 'equal')).toBe(true);
  });

  it('处理 CRLF 换行', () => {
    const ops = diffLines('a\r\nb', 'a\nb');
    expect(ops.every((o) => o.op === 'equal')).toBe(true);
  });

  it('空文本不报错', () => {
    const ops = diffLines('', 'a');
    expect(ops.map((o) => o.op)).toEqual(['add']);
  });

  it('buildSplitRows 输出左右对齐且行数一致', () => {
    const rows = buildSplitRows(diffLines('a\nb', 'a\nc'));
    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({ op: 'remove', left: 'b', right: '' });
    expect(rows[2]).toMatchObject({ op: 'add', left: '', right: 'c' });
  });
});
