import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleTable, { formatClock } from './ScheduleTable.jsx';

const data = {
  summary: '一段关于告别的故事',
  scenes: [
    {
      sceneNumber: 1,
      title: '第一场',
      location: '医院病房',
      characters: ['老陈', '老周'],
      presentCharacters: ['老陈', '老周'],
      props: ['茶杯'],
      stageDirections: ['（老周坐下）'],
      summary: '重逢',
      estimatedMinutes: 6,
      structure: '铺垫',
    },
  ],
  characters: [],
  relationships: [],
};

describe('formatClock', () => {
  it('整数分钟显示 m00，小数分钟换算秒', () => {
    expect(formatClock(6)).toBe("6'00\"");
    expect(formatClock(8.25)).toBe("8'15\"");
    expect(formatClock(0)).toBe("0'00\"");
  });
});

describe('ScheduleTable', () => {
  it('展示总简介与场次关键字段', () => {
    render(<ScheduleTable scriptData={data} />);
    expect(screen.getByText('一段关于告别的故事')).toBeInTheDocument();
    expect(screen.getByText('医院病房')).toBeInTheDocument();
    expect(screen.getByText('老陈、老周')).toBeInTheDocument();
    expect(screen.getByText('茶杯')).toBeInTheDocument();
  });

  it('时长以分秒格式展示', () => {
    render(<ScheduleTable scriptData={data} />);
    expect(screen.getByText("6'00\"")).toBeInTheDocument();
  });

  it('无场次时显示空态', () => {
    render(
      <ScheduleTable
        scriptData={{ summary: '', scenes: [], characters: [], relationships: [] }}
      />,
    );
    expect(screen.getByText('未解析到场次信息。')).toBeInTheDocument();
  });

  it('字段缺失时不崩溃', () => {
    render(
      <ScheduleTable
        scriptData={{
          summary: '',
          scenes: [{ sceneNumber: 1, title: '第一场', location: '客厅' }],
          characters: [],
          relationships: [],
        }}
      />,
    );
    expect(screen.getByText('客厅')).toBeInTheDocument();
    expect(screen.getByText("0'00\"")).toBeInTheDocument();
  });

  it('编辑地点会回调', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.change(screen.getByLabelText('编辑地点'), { target: { value: '客厅' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { location: '客厅' });
  });

  it('编辑时长触发 estimatedMinutes 回写', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.change(screen.getByLabelText('编辑时长（分钟）'), { target: { value: '9' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { estimatedMinutes: 9 });
  });

  it('选择节奏回写 structure', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.change(screen.getByLabelText('选择节奏'), { target: { value: '转折' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { structure: '转折' });
  });

  it('点击展开显示在场人物、舞台说明与剧情摘要', () => {
    render(<ScheduleTable scriptData={data} />);
    // 展开前额外字段不在文档中
    expect(screen.queryByText('（老周坐下）')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('展开详情'));
    expect(screen.getByText('（老周坐下）')).toBeInTheDocument();
    expect(screen.getAllByText('老陈、老周').length).toBeGreaterThan(0);
    expect(screen.getByText('重逢')).toBeInTheDocument();
  });

  it('可编辑模式下展开行可编辑剧情摘要', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.click(screen.getByLabelText('展开详情'));
    fireEvent.change(screen.getByLabelText('编辑剧情摘要'), {
      target: { value: '争执' },
    });
    expect(onChangeScene).toHaveBeenCalledWith(0, { summary: '争执' });
  });
});
