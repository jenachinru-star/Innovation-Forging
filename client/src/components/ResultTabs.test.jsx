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
  it('切换到角色海报能看到人物名称', () => {
    const withChars = {
      summary: '简介', scenes: [],
      characters: [{ name: '老陈', description: '55岁退休教师' }],
      relationships: [],
    };
    render(<ResultTabs scriptData={withChars} onBackToEdit={() => {}} />);
    fireEvent.click(screen.getByText('角色海报'));
    expect(screen.getByText('老陈')).toBeInTheDocument();
  });
  it('来源为样例时显示来源标记', () => {
    render(<ResultTabs scriptData={data} onBackToEdit={() => {}} source="sample" />);
    expect(screen.getByText('来源：样例剧本')).toBeInTheDocument();
  });
});
