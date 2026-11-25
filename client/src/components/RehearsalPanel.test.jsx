import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RehearsalPanel, { buildActivityLog } from './RehearsalPanel.jsx';

describe('RehearsalPanel', () => {
  it('整理三行笔记后分别进入决策、待确认问题与待办，待办可勾选完成', () => {
    render(<RehearsalPanel plan={{ impacts: [] }} dispatch={() => {}} />);

    fireEvent.change(screen.getByLabelText('排练笔记'), {
      target: { value: '开场先暗场\n灯什么时候亮？\n#确认钥匙位置' },
    });
    fireEvent.click(screen.getByText('整理'));

    expect(screen.getByText('开场先暗场')).toBeInTheDocument();
    expect(screen.getByText('灯什么时候亮？')).toBeInTheDocument();
    expect(screen.getByText('确认钥匙位置')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('整理后派发 setRehearsalNotes，payload 含三类条目', () => {
    const dispatch = vi.fn();
    render(<RehearsalPanel plan={{ impacts: [] }} dispatch={dispatch} />);

    fireEvent.change(screen.getByLabelText('排练笔记'), {
      target: { value: '开场先暗场\n灯什么时候亮？\n#确认钥匙位置' },
    });
    fireEvent.click(screen.getByText('整理'));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setRehearsalNotes',
        payload: expect.objectContaining({
          notes: '开场先暗场\n灯什么时候亮？\n#确认钥匙位置',
          decisions: ['开场先暗场'],
          openQuestions: ['灯什么时候亮？'],
          todos: [{ text: '确认钥匙位置', done: false }],
        }),
      })
    );
  });

  it('从 plan.rehearsals[0] 读取已保存的整理结果', () => {
    const plan = {
      impacts: [],
      rehearsals: [
        {
          id: 'reh-1',
          notes: '开场先暗场\n灯什么时候亮？\n#确认钥匙位置',
          decisions: ['开场先暗场'],
          openQuestions: ['灯什么时候亮？'],
          todos: [{ text: '确认钥匙位置', done: false }],
        },
      ],
    };

    render(<RehearsalPanel plan={plan} dispatch={() => {}} />);

    expect(screen.getByLabelText('排练笔记').value).toBe(
      '开场先暗场\n灯什么时候亮？\n#确认钥匙位置'
    );
    expect(screen.getByText('开场先暗场')).toBeInTheDocument();
    expect(screen.getByText('灯什么时候亮？')).toBeInTheDocument();
    expect(screen.getByText('确认钥匙位置')).toBeInTheDocument();
  });

  it('点击影响条目的「保留旧版」派发 resolveImpact(keptOld)', () => {
    const dispatch = vi.fn();
    const plan = {
      impacts: [
        {
          id: 'imp-1',
          target: { kind: 'cue', refId: 'cue-1' },
          reason: '该提示绑定的台词在新版剧本中已不存在',
          suggestion: '重新绑定到其他台词，或删除该提示',
          status: 'open',
        },
      ],
    };

    render(<RehearsalPanel plan={plan} dispatch={dispatch} />);

    expect(
      screen.getByText('该提示绑定的台词在新版剧本中已不存在')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('保留旧版'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'resolveImpact',
      id: 'imp-1',
      status: 'keptOld',
    });
  });

  it('待办完成率随勾选更新', () => {
    render(<RehearsalPanel plan={{ impacts: [] }} dispatch={() => {}} />);

    fireEvent.change(screen.getByLabelText('排练笔记'), {
      target: { value: '#确认钥匙位置\n#检查灯光' },
    });
    fireEvent.click(screen.getByText('整理'));

    expect(screen.getByTestId('todo-rate').textContent).toContain('0/2');
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByTestId('todo-rate').textContent).toContain('1/2');
    expect(screen.getByTestId('todo-rate').textContent).toContain('50%');
  });

  it('筛选只显示已完成待办', () => {
    render(<RehearsalPanel plan={{ impacts: [] }} dispatch={() => {}} />);

    fireEvent.change(screen.getByLabelText('排练笔记'), {
      target: { value: '#确认钥匙位置\n#检查灯光' },
    });
    fireEvent.click(screen.getByText('整理'));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    fireEvent.click(screen.getByText('已完成'));
    expect(screen.getByText('确认钥匙位置')).toBeInTheDocument();
    expect(screen.queryByText('检查灯光')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('未完成'));
    expect(screen.getByText('检查灯光')).toBeInTheDocument();
    expect(screen.queryByText('确认钥匙位置')).not.toBeInTheDocument();
  });

  it('按时间倒序渲染讨论活动日志', () => {
    const plan = {
      impacts: [],
      discussions: [
        { id: 'd1', title: '较早讨论', kind: 'text', createdAt: '2026-11-24T10:00:00Z', status: 'done' },
        { id: 'd2', title: '录音复盘', kind: 'audio', createdAt: '2026-11-25T10:00:00Z', status: 'done' },
      ],
    };

    render(<RehearsalPanel plan={plan} dispatch={() => {}} />);

    const log = screen.getByTestId('activity-log');
    expect(log.children[0]).toHaveAttribute('data-testid', 'activity-d2');
    expect(screen.getByText('录音复盘')).toBeInTheDocument();
    expect(screen.getByText('录音讨论')).toBeInTheDocument();
  });
});

describe('buildActivityLog', () => {
  it('过滤无效项并按创建时间倒序', () => {
    const result = buildActivityLog([
      { id: 'd1', title: '较早', kind: 'text', createdAt: '2026-11-24T10:00:00Z' },
      null,
      { id: 'd2', title: '较新', kind: 'audio', createdAt: '2026-11-25T10:00:00Z' },
    ]);
    expect(result.map((item) => item.id)).toEqual(['d2', 'd1']);
    expect(result[0].kind).toBe('audio');
  });

  it('入参非数组时返回空数组', () => {
    expect(buildActivityLog(undefined)).toEqual([]);
  });
});
