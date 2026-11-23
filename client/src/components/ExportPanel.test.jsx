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
  const nativeCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock');
    revokeObjectURL = vi.fn();
    click = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const element = nativeCreateElement(tag);
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

  it('部门需求单导出内容带「第 N 场」', async () => {
    render(<ExportPanel title="雨夜重逢方案" scriptData={scriptData} plan={plan} />);

    fireEvent.click(screen.getByRole('button', { name: '部门需求单' }));

    const blob = createObjectURL.mock.calls[0][0];
    const content = await blob.text();
    expect(content).toContain('第 1 场');
    expect(content).toContain('音乐渐入');
  });

  it('环境不支持 createObjectURL 时提示改用打印且不抛错', () => {
    URL.createObjectURL = undefined;

    render(<ExportPanel title="雨夜重逢方案" scriptData={scriptData} plan={plan} />);

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: '部门需求单' }))
    ).not.toThrow();
    expect(screen.getByRole('status')).toHaveTextContent('当前环境不支持下载，可改用浏览器打印（Ctrl+P）');
  });

  it('下载前把链接挂到页面，并延迟释放对象 URL', () => {
    vi.useFakeTimers();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    try {
      render(<ExportPanel title="雨夜重逢方案" scriptData={scriptData} plan={plan} />);
      fireEvent.click(screen.getByRole('button', { name: '部门需求单' }));

      expect(appendSpy).toHaveBeenCalled();
      const appended = appendSpy.mock.calls[appendSpy.mock.calls.length - 1][0];
      expect(appended.tagName).toBe('A');
      expect(revokeObjectURL).not.toHaveBeenCalled();

      vi.advanceTimersByTime(0);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    } finally {
      appendSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('链接不支持 click 时提示改用打印且不误报成功', () => {
    createElementSpy.mockImplementation((tag) => {
      const element = nativeCreateElement(tag);
      if (String(tag).toLowerCase() === 'a') {
        element.click = undefined;
      }
      return element;
    });

    render(<ExportPanel title="雨夜重逢方案" scriptData={scriptData} plan={plan} />);

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: '部门需求单' }))
    ).not.toThrow();
    expect(screen.getByRole('status')).toHaveTextContent(
      '当前环境不支持下载，可改用浏览器打印（Ctrl+P）'
    );
  });
});
