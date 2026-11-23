import { describe, it, expect } from 'vitest';
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

    expect(screen.getByText('灯光')).toBeInTheDocument();
    expect(screen.getByText('音乐')).toBeInTheDocument();
    expect(screen.getByText('这里想更暖一点')).toBeInTheDocument();
    expect(screen.getByText('加个定点')).toBeInTheDocument();
    expect(screen.getByText('音乐渐入')).toBeInTheDocument();
  });
});
