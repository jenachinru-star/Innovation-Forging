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
  it('切换到排练与影响标签显示排练笔记面板', () => {
    render(
      <ResultTabs
        scriptData={data}
        onBackToEdit={() => {}}
        plan={{ impacts: [] }}
        dispatch={() => {}}
      />
    );
    fireEvent.click(screen.getByText('排练与影响'));
    expect(screen.getByLabelText('排练笔记')).toBeInTheDocument();
  });

  it('切换到需求转译标签显示场次下拉', () => {
    const withScenes = {
      summary: '简介',
      scenes: [{ id: 'sc-1', sceneNumber: 1, title: '第一场' }],
      characters: [],
      relationships: [],
    };
    render(
      <ResultTabs
        scriptData={withScenes}
        onBackToEdit={() => {}}
        plan={{ briefs: [] }}
        dispatch={() => {}}
      />
    );
    fireEvent.click(screen.getByText('需求转译'));
    expect(screen.getByLabelText('场次')).toBeInTheDocument();
  });

  it('走位示意默认第一场且可切换场次', () => {
    const withScenes = {
      summary: '简介',
      scenes: [
        { id: 'sc-1', sceneNumber: 1, title: '第一场', presentCharacters: ['老陈'] },
        { id: 'sc-2', sceneNumber: 2, title: '第二场', presentCharacters: ['阿岚'] },
      ],
      characters: [
        { id: 'ch-老陈', name: '老陈' },
        { id: 'ch-阿岚', name: '阿岚' },
      ],
      relationships: [],
    };
    render(
      <ResultTabs
        scriptData={withScenes}
        onBackToEdit={() => {}}
        plan={{ cues: [], staging: null }}
        dispatch={() => {}}
      />
    );

    fireEvent.click(screen.getByText('走位与提示'));
    expect(screen.getByTestId('actor-老陈')).toBeInTheDocument();
    expect(screen.queryByTestId('actor-阿岚')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('走位场次'), { target: { value: '2' } });

    expect(screen.getByTestId('actor-阿岚')).toBeInTheDocument();
    expect(screen.queryByTestId('actor-老陈')).not.toBeInTheDocument();
  });

  it('切换到视觉制作显示视觉族与导演库', () => {
    render(
      <ResultTabs
        scriptData={{
          summary: '简介',
          scenes: [],
          characters: [{ id: 'ch-1', name: '老陈' }],
          relationships: [],
        }}
        onBackToEdit={() => {}}
        plan={{ assets: [] }}
        dispatch={() => {}}
      />
    );
    fireEvent.click(screen.getByText('视觉制作'));
    expect(screen.getByText('先锁定世界观，再生成资产')).toBeInTheDocument();
    expect(screen.getByText('冷调惊悚')).toBeInTheDocument();
  });
});
