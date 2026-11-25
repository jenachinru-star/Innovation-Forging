import { describe, it, expect, vi } from 'vitest';
import { useReducer } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BriefPanel from './BriefPanel.jsx';
import { createPlan, planReducer } from '../store/plan.js';

const scenes = [
  { id: 'sc-1', sceneNumber: 1, title: '第一场', location: '客厅' },
  { id: 'sc-2', sceneNumber: 2, title: '第二场', location: '门口' },
];

function Harness() {
  const [plan, dispatch] = useReducer(planReducer, undefined, () =>
    createPlan('stage', '测试方案')
  );
  return <BriefPanel scenes={scenes} plan={plan} dispatch={dispatch} />;
}

describe('BriefPanel', () => {
  it('渲染场次下拉', () => {
    render(<Harness />);
    const select = screen.getByLabelText('场次');
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/第一场/)).toBeInTheDocument();
  });

  it('拆分原话后按部门分组并保留原话', () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('导演原话'), {
      target: { value: '这里想更暖一点，加个定点；音乐渐入' },
    });
    fireEvent.click(screen.getByRole('button', { name: '拆分' }));

    expect(screen.getByTestId('brief-group-lighting')).toBeInTheDocument();
    expect(screen.getByTestId('brief-group-music')).toBeInTheDocument();
    expect(screen.getByText('这里想更暖一点')).toBeInTheDocument();
    expect(screen.getByText('加个定点')).toBeInTheDocument();
    expect(screen.getByText('音乐渐入')).toBeInTheDocument();
  });

  it('拆分时把当前场次的 sceneNumber 传给 splitBrief', () => {
    const dispatch = vi.fn();
    render(<BriefPanel scenes={scenes} plan={{ briefs: [], cues: [] }} dispatch={dispatch} />);

    fireEvent.change(screen.getByLabelText('导演原话'), {
      target: { value: '加个定点' },
    });
    fireEvent.click(screen.getByRole('button', { name: '拆分' }));

    const call = dispatch.mock.calls.find(([action]) => action.type === 'addBrief');
    expect(call).toBeTruthy();
    expect(call[0].brief.sceneNumber).toBe(1);
  });

  it('每条需求可通过「关联提示」选择本场提示并写入 cueId', () => {
    const dispatch = vi.fn();
    const plan = {
      cues: [
        {
          id: 'cue-1',
          department: 'lighting',
          sceneNumber: 1,
          content: '加定点',
          trigger: { type: 'free', quote: '' },
        },
        {
          id: 'cue-2',
          department: 'music',
          sceneNumber: 2,
          content: '音乐渐入',
          trigger: { type: 'free', quote: '' },
        },
      ],
      briefs: [
        {
          id: 'brief-1',
          department: 'lighting',
          sceneNumber: 1,
          original: '加个定点',
          items: ['加个定点'],
          uncertain: [],
          status: 'draft',
          cueId: null,
        },
      ],
    };

    render(<BriefPanel scenes={scenes} plan={plan} dispatch={dispatch} />);

    const select = screen.getByLabelText('关联提示');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(options.join(' ')).toContain('加定点');
    expect(options.join(' ')).not.toContain('音乐渐入');

    fireEvent.change(select, { target: { value: 'cue-1' } });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'updateBrief',
      id: 'brief-1',
      patch: { cueId: 'cue-1' },
    });
  });

  it('部门 Tab 切换后只显示对应部门卡片', () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('导演原话'), {
      target: { value: '这里想更暖一点，加个定点；音乐渐入' },
    });
    fireEvent.click(screen.getByRole('button', { name: '拆分' }));

    expect(screen.getByTestId('brief-group-lighting')).toBeInTheDocument();
    expect(screen.getByTestId('brief-group-music')).toBeInTheDocument();

    const lightTab = screen
      .getAllByRole('tab')
      .find((button) => button.textContent.includes('灯光'));
    fireEvent.click(lightTab);

    expect(screen.getByTestId('brief-group-lighting')).toBeInTheDocument();
    expect(screen.queryByTestId('brief-group-music')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('tab').find((button) => button.textContent.includes('全部'))
    );
    expect(screen.getByTestId('brief-group-music')).toBeInTheDocument();
  });
});
