import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
