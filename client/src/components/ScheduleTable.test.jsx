import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleTable from './ScheduleTable.jsx';

const data = {
  summary: '一段关于告别的故事',
  scenes: [
    { sceneNumber: 1, title: '第一场', location: '医院病房', characters: ['老陈', '老周'], props: ['茶杯'], summary: '重逢', estimatedMinutes: 6 },
  ],
  characters: [],
  relationships: [],
};

describe('ScheduleTable', () => {
  it('展示总简介与场次信息', () => {
    render(<ScheduleTable scriptData={data} />);
    expect(screen.getByText('一段关于告别的故事')).toBeInTheDocument();
    expect(screen.getByText('医院病房')).toBeInTheDocument();
    expect(screen.getByText('老陈、老周')).toBeInTheDocument();
    expect(screen.getByText('茶杯')).toBeInTheDocument();
    expect(screen.getByText('6 分钟')).toBeInTheDocument();
  });

  it('无场次时显示空态', () => {
    render(<ScheduleTable scriptData={{ summary: '', scenes: [], characters: [], relationships: [] }} />);
    expect(screen.getByText('未解析到场次信息。')).toBeInTheDocument();
  });

  it('字段缺失时不崩溃（characters/props 缺省为空）', () => {
    render(<ScheduleTable scriptData={{ summary: '', scenes: [{ sceneNumber: 1, title: '第一场', location: '客厅' }], characters: [], relationships: [] }} />);
    expect(screen.getByText('客厅')).toBeInTheDocument();
    expect(screen.getByText('0 分钟')).toBeInTheDocument();
  });

  it('传入 onChangeScene 时，编辑地点会回调', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    const cell = screen.getByDisplayValue('医院病房');
    fireEvent.change(cell, { target: { value: '客厅' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { location: '客厅' });
  });
});
