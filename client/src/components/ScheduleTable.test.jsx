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
      note: '',
      estimatedMinutes: 6,
      structure: '铺垫',
    },
    {
      sceneNumber: 2,
      title: '第二场',
      location: '',
      characters: ['老陈'],
      presentCharacters: ['老陈'],
      props: [],
      stageDirections: [],
      summary: '',
      note: '',
      estimatedMinutes: 3,
      structure: '',
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
  it('展示总简介与场次关键字段，道具不再作为主表列', () => {
    render(<ScheduleTable scriptData={data} />);
    expect(screen.getByText('一段关于告别的故事')).toBeInTheDocument();
    expect(screen.getByText('医院病房')).toBeInTheDocument();
    expect(screen.getByText('老陈、老周')).toBeInTheDocument();
    // 道具列已移除，主表不直接展示道具
    expect(screen.queryByText('茶杯')).not.toBeInTheDocument();
  });

  it('缺景场次显示待补问号', () => {
    render(<ScheduleTable scriptData={data} />);
    expect(screen.getByText('待补 ?')).toBeInTheDocument();
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
    fireEvent.change(screen.getAllByLabelText('编辑地点')[0], { target: { value: '客厅' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { location: '客厅' });
  });

  it('编辑时长触发 estimatedMinutes 回写', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.change(screen.getAllByLabelText('编辑时长（分钟）')[0], { target: { value: '9' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { estimatedMinutes: 9 });
  });

  it('选择节奏回写 structure', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.change(screen.getAllByLabelText('选择节奏')[0], { target: { value: '转折' } });
    expect(onChangeScene).toHaveBeenCalledWith(0, { structure: '转折' });
  });

  it('点击展开显示舞台说明、在场人物、AI 简介与手工备注', () => {
    render(<ScheduleTable scriptData={data} />);
    expect(screen.queryByText('（老周坐下）')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText('展开详情')[0]);
    expect(screen.getByText('（老周坐下）')).toBeInTheDocument();
    // 非编辑模式下 AI 简介以文本展示
    expect(screen.getByText('重逢')).toBeInTheDocument();
    expect(screen.getByText('手工备注')).toBeInTheDocument();
  });

  it('可编辑模式下编辑 AI 简介回写 summary', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.click(screen.getAllByLabelText('展开详情')[0]);
    fireEvent.change(screen.getByLabelText('编辑 AI 简介'), {
      target: { value: '争执' },
    });
    expect(onChangeScene).toHaveBeenCalledWith(0, { summary: '争执' });
  });

  it('可编辑模式下编辑手工备注回写 note', () => {
    const onChangeScene = vi.fn();
    render(<ScheduleTable scriptData={data} onChangeScene={onChangeScene} />);
    fireEvent.click(screen.getAllByLabelText('展开详情')[0]);
    fireEvent.change(screen.getByLabelText('编辑手工备注'), {
      target: { value: '导演补充' },
    });
    expect(onChangeScene).toHaveBeenCalledWith(0, { note: '导演补充' });
  });
});
