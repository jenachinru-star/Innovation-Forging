import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssetLibrary from './AssetLibrary.jsx';

const plan = {
  assets: [
    { id: 'a1', type: 'character', characterName: '阿珍', url: 'u1' },
    { id: 'a2', type: 'scene', title: '老戏台', url: 'u2' },
    { id: 'a3', type: 'image', title: '助手草图', url: 'u3', source: 'assistant' },
  ],
};

describe('AssetLibrary', () => {
  it('渲染全部可用资产卡片', () => {
    render(<AssetLibrary plan={plan} />);
    expect(screen.getAllByTestId(/^asset-card-/)).toHaveLength(3);
    expect(screen.getByText('阿珍')).toBeInTheDocument();
    expect(screen.getByText('AI 助手')).toBeInTheDocument();
  });

  it('点击类型筛选只显示对应类型', () => {
    render(<AssetLibrary plan={plan} />);
    fireEvent.click(screen.getByRole('tab', { name: /人物/ }));
    expect(screen.getAllByTestId(/^asset-card-/)).toHaveLength(1);
    expect(screen.getByText('阿珍')).toBeInTheDocument();
  });

  it('按关键字搜索过滤', () => {
    render(<AssetLibrary plan={plan} />);
    fireEvent.change(screen.getByLabelText('搜索资产'), { target: { value: '老戏台' } });
    expect(screen.getAllByTestId(/^asset-card-/)).toHaveLength(1);
    expect(screen.getByText('老戏台')).toBeInTheDocument();
  });

  it('点击缩略图打开预览并可关闭', () => {
    render(<AssetLibrary plan={plan} />);
    fireEvent.click(screen.getByRole('button', { name: '预览 阿珍' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '关闭预览' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
