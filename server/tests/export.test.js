import { describe, it, expect } from 'vitest';
import { toHtml, toCsv, toFountain } from '@director/shared/export/index.js';

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

  it('部门需求单显示所属场次', () => {
    const html = toHtml({ scriptData, plan, now: '2026-11-23 10:30' });

    expect(html).toContain('第 1 场 · 音乐渐入');
  });

  it('视觉方案进入打印材料并生成色带', () => {
    const html = toHtml({
      scriptData,
      plan: {
        ...plan,
        style: {
          familyName: '黑色悬疑与冷调惊悚',
          directorName: '希区柯克',
          palette: ['#1a1918', '#6d6d65', '#bdb7aa', '#2f6450', '#b1332e'],
        },
      },
    });
    expect(html).toContain('视觉方向：希区柯克');
    expect(html).toContain('class="style-band"');
    expect(html).toContain('#2f6450');
  });

  it('讨论与复盘纪要进入导出 HTML', () => {
    const html = toHtml({
      scriptData,
      plan: {
        ...plan,
        discussions: [
          {
            id: 'disc-1',
            title: '灯光讨论',
            kind: 'text',
            createdAt: '2026-11-23T10:30:00',
            transcript: '决定开场改暖光。',
            summary: {
              overview: '确定开场灯光',
              decisions: ['开场改暖光'],
              todos: [],
              changes: [],
              questions: [],
            },
          },
        ],
      },
    });
    expect(html).toContain('讨论与复盘纪要');
    expect(html).toContain('灯光讨论');
    expect(html).toContain('开场改暖光');
  });

  it('手动复盘与资料收藏进入导出 HTML', () => {
    const html = toHtml({
      scriptData,
      plan: {
        ...plan,
        review: {
          goal: '走完开场走位',
          wentWell: '',
          improve: '灯光切换偏慢',
          nextActions: '',
          conclusion: '整体达标',
        },
        collections: [
          { id: 'coll-1', text: '参考色卡 https://example.com' },
          { id: 'coll-2', text: '暖棕备注' },
        ],
      },
    });

    expect(html).toContain('手动复盘');
    expect(html).toContain('走完开场走位');
    expect(html).toContain('灯光切换偏慢');
    expect(html).not.toContain('做得好的：');
    expect(html).toContain('资料收藏');
    expect(html).toContain('参考色卡 https://example.com');
    expect(html).toContain('暖棕备注');
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

    expect(csv[0]).toBe('\uFEFF');
    expect(csv.split('\n')[0]).toBe('\uFEFFa,b');
    expect(csv).toBe('\uFEFFa,b\n1,"换\n行"\n"他说""好""",2');
  });

  it('缺失字段输出为空字符串', () => {
    expect(toCsv([{ a: 'x' }], ['a', 'b'])).toBe('\uFEFFa,b\nx,');
  });
});

describe('toFountain', () => {
  it('输出可继续编辑的 Fountain 文本并保留人物台词', () => {
    const text = toFountain({
      title: '雨夜重逢方案',
      scriptData: {
        scenes: [
          {
            location: '老宅客厅',
            lines: [{ speaker: '老陈', text: '你终于回来了' }],
          },
        ],
      },
    });
    expect(text).toContain('Title: 雨夜重逢方案');
    expect(text).toContain('INT. 老宅客厅');
    expect(text).toContain('\n老陈\n你终于回来了');
  });
});
