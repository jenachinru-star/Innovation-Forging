import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CadencePanel, { RHYTHM_CYCLE } from './CadencePanel.jsx';
import ScheduleTable from './ScheduleTable.jsx';

describe('节奏闭环补全：高潮', () => {
  it('CadencePanel 节奏循环以高潮收尾', () => {
    expect(RHYTHM_CYCLE).toContain('高潮');
    expect(RHYTHM_CYCLE[RHYTHM_CYCLE.length - 1]).toBe('高潮');
  });

  it('CadencePanel 点击一次推进到铺垫', () => {
    const scenes = [{ sceneNumber: 1, title: '第一场', structure: '' }];
    const onChange = vi.fn();
    render(<CadencePanel scenes={scenes} onChange={onChange} />);
    const dot = screen.getByRole('button', { name: /节奏：未标注/ });
    fireEvent.click(dot);
    expect(onChange).toHaveBeenLastCalledWith(0, { structure: '铺垫' });
  });

  it('ScheduleTable 节奏下拉含高潮选项', () => {
    const scriptData = { scenes: [{ sceneNumber: 1, title: '第一场', structure: '' }] };
    render(<ScheduleTable scriptData={scriptData} />);
    const select = screen.getByLabelText('选择节奏');
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.some((o) => o.textContent === '高潮')).toBe(true);
  });
});