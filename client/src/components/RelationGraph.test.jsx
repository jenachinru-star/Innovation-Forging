import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RelationGraph from './RelationGraph.jsx';

vi.mock('echarts/core', () => {
  class MockChart {
    setOption() {}
    on() {}
    dispose() {}
  }
  return {
    default: {
      use: vi.fn(),
      init: vi.fn(() => new MockChart()),
    },
  };
});
vi.mock('echarts/charts', () => ({ GraphChart: 'GraphChart' }));
vi.mock('echarts/components', () => ({
  TooltipComponent: 'Tooltip',
  LegendComponent: 'Legend',
}));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: 'Canvas' }));

const scriptData = {
  characters: [
    { name: '老陈', role: '父亲', description: '独自居住的老父亲。' },
    { name: '阿岚', role: '女儿', description: '离家多年的女儿。' },
    { name: '老周', role: '邻居', description: '热心的老街坊。' },
  ],
  relationships: [
    { from: '老陈', to: '阿岚', relation: '父女', needsReview: false },
    { from: '老周', to: '老陈', relation: '老友', needsReview: false },
    { from: '老周', to: '阿岚', relation: '熟识', needsReview: true },
  ],
  scenes: [
    { id: 's1', sceneNumber: 1, title: '客厅', characters: ['老陈', '阿岚'] },
    { id: 's2', sceneNumber: 2, title: '门口', characters: ['阿岚', '老周'] },
    { id: 's3', sceneNumber: 3, title: '客厅', characters: ['老陈', '阿岚'] },
  ],
};

describe('RelationGraph', () => {
  it('无关系时显示提示语', () => {
    render(
      <RelationGraph
        scriptData={{ characters: [{ name: '甲' }], relationships: [], scenes: [] }}
      />
    );
    expect(screen.getByText(/暂无足够的人物关系信息/)).toBeInTheDocument();
  });

  it('渲染四张统计卡及数值', () => {
    render(<RelationGraph scriptData={scriptData} />);
    const statsArea = within(document.querySelector('.relation-stats'));
    expect(statsArea.getByText('人物').nextElementSibling).toHaveTextContent('3');
    expect(statsArea.getByText('关系').nextElementSibling).toHaveTextContent('3');
    expect(statsArea.getByText('需核实').nextElementSibling).toHaveTextContent('1');
    expect(statsArea.getByText('线索').nextElementSibling).toHaveTextContent('3');
  });

  it('渲染全部/需核实/已确认三个筛选', () => {
    render(<RelationGraph scriptData={scriptData} />);
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '需核实' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '已确认' })).toBeInTheDocument();
  });

  it('默认展示第一个人物的档案与角色', () => {
    render(<RelationGraph scriptData={scriptData} />);
    expect(screen.getByText('独自居住的老父亲。')).toBeInTheDocument();
    expect(screen.getByText('父亲')).toBeInTheDocument();
  });

  it('人物档案列出出场场景标签', () => {
    render(<RelationGraph scriptData={scriptData} />);
    // 老陈出场于第 1、3 场，标题均为“客厅”
    expect(screen.getAllByRole('button', { name: '客厅' })).toHaveLength(2);
  });

  it('关系速览列出全部关系并标注需核实', () => {
    render(<RelationGraph scriptData={scriptData} />);
    expect(screen.getByText('老陈 — 阿岚')).toBeInTheDocument();
    expect(screen.getByText('老周 — 老陈')).toBeInTheDocument();
    const reviewItem = screen.getByText('老周 — 阿岚').closest('li');
    expect(reviewItem).toHaveClass('is-review');
  });

  it('点击关系速览项切换人物档案', () => {
    render(<RelationGraph scriptData={scriptData} />);
    fireEvent.click(screen.getByText('老周 — 老陈'));
    expect(screen.getByText('热心的老街坊。')).toBeInTheDocument();
    expect(screen.getByText('邻居')).toBeInTheDocument();
  });

  it('点击筛选按钮切换激活态', () => {
    render(<RelationGraph scriptData={scriptData} />);
    const reviewButton = screen.getByRole('button', { name: '需核实' });
    expect(reviewButton).not.toHaveClass('is-active');
    fireEvent.click(reviewButton);
    expect(reviewButton).toHaveClass('is-active');
  });
});
