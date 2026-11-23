import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultTabs from './ResultTabs.jsx';

const data = {
  summary: '简介', scenes: [], characters: [], relationships: [],
};

describe('ResultTabs', () => {
  it('默认显示排演表，可切换到关系图', () => {
    render(<ResultTabs scriptData={data} onBackToEdit={() => {}} />);
    expect(screen.getByText('排演准备表')).toBeInTheDocument();
    fireEvent.click(screen.getByText('人物关系图'));
    expect(screen.getByText(/暂无足够的人物关系信息/)).toBeInTheDocument();
  });
  it('返回编辑回调', () => {
    const onBack = vi.fn();
    render(<ResultTabs scriptData={data} onBackToEdit={onBack} />);
    fireEvent.click(screen.getByText('返回编辑剧本'));
    expect(onBack).toHaveBeenCalled();
  });
});
