import { describe, it, expect } from 'vitest';
import { toHtml, toCsv } from '@director/shared/export/index.js';

const scriptData = {
  summary: '一个雨夜里的重逢。',
  scenes: [
    {
      id: 'sc-1',
      sceneNumber: 1,
      title: '第一场 · 雨夜',
      location: '老宅客厅',
      characters: ['老陈', '小林'],
      presentCharacters: ['老陈', '小林'],
      props: ['雨伞', '旧相册'],
      stageDirections: ['灯光渐暗', '雨声起'],
      summary: '父女重逢',
      estimatedMinutes: 12,
    },
  ],
  characters: [{ id: 'ch-1', name: '老陈' }],
  relationships: [],
  acts: [],
  meta: { source: 'upload', importedAt: '', parser: 'offline' },
};

const plan = {
  id: 'plan-1',
  type: 'stage',
  name: '雨夜重逢方案',
  segments: [],
  cues: [
    {
      id: 'cue-1',
      department: 'lighting',
      sceneNumber: 1,
      trigger: { type: 'line', quote: '你终于回来了' },
      content: '台口暖光渐亮',
      status: 'draft',
    },
  ],
  briefs: [
    {
      id: 'brief-1',
      department: 'music',
      sceneNumber: 1,
      original: '音乐渐入',
      items: ['音乐渐入'],
      uncertain: [],
      status: 'draft',
      dueDate: null,
    },
  ],
  staging: {
    placements: [{ sceneNumber: 1, characterId: '老陈', x: 100, y: 220 }],
    paths: [],
    notes: [],
  },
  rehearsals: [],
  impacts: [],
};

describe('toHtml', () => {
  it('包含方案名、四个部门中文名与打印样式', () => {
    const html = toHtml({
      title: '雨夜重逢方案',
      scriptData,
      plan,
      now: new Date('2026-11-23T10:30:00'),
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('雨夜重逢方案');
    for (const label of ['灯光', '音乐', '音响', '舞美']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('@media print');
    expect(html).toContain('#fffdf7');
    expect(html).toContain('#1c1917');
  });

  it('渲染场次、提示与走位信息', () => {
    const html = toHtml({ scriptData, plan, now: '2026-11-23 10:30' });

    expect(html).toContain('第一场 · 雨夜');
    expect(html).toContain('台口暖光渐亮');
    expect(html).toContain('老陈');
    expect(html).toContain('雨夜重逢方案');
  });
});

describe('toCsv', () => {
  it('首行为表头，含逗号/引号/换行的字段被正确包裹', () => {
    const csv = toCsv(
      [
        { a: '1', b: '换\n行' },
        { a: '他说"好"', b: '2' },
      ],
      ['a', 'b']
    );

    expect(csv.split('\n')[0]).toBe('a,b');
    expect(csv).toBe('a,b\n1,"换\n行"\n"他说""好""",2');
  });

  it('缺失字段输出为空字符串', () => {
    expect(toCsv([{ a: 'x' }], ['a', 'b'])).toBe('a,b\nx,');
  });
});
