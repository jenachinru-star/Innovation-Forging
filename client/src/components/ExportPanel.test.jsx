import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportPanel from './ExportPanel.jsx';

const scriptData = {
  summary: '简介',
  scenes: [
    {
      id: 'sc-1',
      sceneNumber: 1,
      title: '第一场',
      location: '客厅',
      characters: ['老陈'],
      presentCharacters: ['老陈'],
      props: ['雨伞'],
      stageDirections: ['灯光渐暗'],
      summary: '重逢',
      estimatedMinutes: 10,
    },
  ],
  characters: [{ id: 'ch-1', name: '老陈' }],
  relationships: [],
  acts: [],
};

const plan = {
  name: '雨夜重逢方案',
  cues: [
    {
      id: 'cue-1',
      department: 'lighting',
      sceneNumber: 1,
      trigger: { type: 'line', quote: '你回来了' },
      content: '暖光渐亮',
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
    },
  ],
  staging: { placements: [{ sceneNumber: 1, characterId: '老陈', x: 1, y: 2 }] },
};

describe('ExportPanel', () => {
  let createObjectURL;
  let revokeObjectURL;
  let click;
  let createElementSpy;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock');
    revokeObjectURL = vi.fn();
    click = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const original = document.createElement.bind(document);
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const element = original(tag);
      if (String(tag).toLowerCase() === 'a') {
        element.click = click;
      }
      return element;
    });
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it('点击「部门需求单」不抛错并触发下载', () => {
    render(<ExportPanel title="雨夜重逢方案" scriptData={scriptData} plan={plan} />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: '部门需求单' }))).not.toThrow();
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it('依次点击四个导出按钮都能触发下载', () => {
    render(<ExportPanel title="雨夜重逢方案" scriptData={scriptData} plan={plan} />);

    for (const name of ['排演准备表', '部门需求单', '走位与提示', '全部']) {
      fireEvent.click(screen.getByRole('button', { name }));
    }

    expect(createObjectURL).toHaveBeenCalledTimes(4);
  });
});
