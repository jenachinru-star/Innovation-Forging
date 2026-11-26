import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoMenu from './TodoMenu.jsx';

const plan = {
  briefs: [{ status: 'needsReview' }],
  impacts: [{ status: 'open' }],
  style: { id: 's1' },
};

describe('TodoMenu', () => {
  it('渲染待办按钮与数量角标', () => {
    render(<TodoMenu plan={plan} onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /待办/ })).toBeInTheDocument();
    expect(screen.getByTestId('todo-badge').textContent).toBe('2');
  });

  it('点击展开下拉并显示待办项', () => {
    render(<TodoMenu plan={plan} onNavigate={() => {}} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /待办/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('待核实部门需求')).toBeInTheDocument();
    expect(screen.getByText('待处理排练影响')).toBeInTheDocument();
  });

  it('点击待办项调用 onNavigate 并关闭下拉', () => {
    const onNavigate = vi.fn();
    render(<TodoMenu plan={plan} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /待办/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /待核实部门需求/ }));
    expect(onNavigate).toHaveBeenCalledWith('briefs');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('按 Esc 关闭下拉', () => {
    render(<TodoMenu plan={plan} onNavigate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /待办/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
