import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CadencePanel from './CadencePanel.jsx';

const scenes = [
  { sceneNumber: 1, title: '第一场', estimatedMinutes: 5, structure: '' },
  { sceneNumber: 2, title: '第二场', estimatedMinutes: 3, structure: '' },
  { sceneNumber: 3, title: '第三场', estimatedMinutes: 8, structure: '' },
];

describe('CadencePanel', () => {
  it('每场一条节奏条，最长的条宽度为 100%', () => {
    render(<CadencePanel scenes={scenes} briefs={[]} />);

    const bars = screen.getAllByTestId('cadence-bar');
    expect(bars).toHaveLength(3);

    const longest = bars.find((bar) => bar.getAttribute('data-scene') === '3');
    expect(longest).toBeTruthy();
    expect(longest.style.width).toBe('100%');
  });

  it('时间线按 dueDate 升序列出部门与摘要', () => {
    const briefs = [
      { id: 'b-late', department: 'music', dueDate: '2026-12-05', original: '配乐确认' },
      { id: 'b-none', department: 'sound', dueDate: null, original: '音效待定' },
      { id: 'b-early', department: 'lighting', dueDate: '2026-12-01', original: '灯光走位' },
    ];

    render(<CadencePanel scenes={scenes} briefs={briefs} />);

    const items = screen.getAllByTestId('cadence-brief');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('2026-12-01');
    expect(items[0]).toHaveTextContent('灯光');
    expect(items[0]).toHaveTextContent('灯光走位');
    expect(items[1]).toHaveTextContent('2026-12-05');
    expect(items[1]).toHaveTextContent('音乐');
  });

  it('选择结构标签回写 scene.structure', () => {
    const onChange = vi.fn();
    render(<CadencePanel scenes={scenes} briefs={[]} onChange={onChange} />);

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '高潮' } });

    expect(onChange).toHaveBeenCalledWith(0, { structure: '高潮' });
  });
});
