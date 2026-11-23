import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RehearsalPanel from './RehearsalPanel.jsx';

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
});
