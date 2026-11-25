import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VersionCompare from './VersionCompare.jsx';

describe('VersionCompare 双栏逐行 diff', () => {
  it('渲染两个上传卡片', () => {
    render(<VersionCompare onBack={() => {}} />);
    expect(screen.getByText('旧版本（上传）')).toBeInTheDocument();
    expect(screen.getByText('新版本（上传）')).toBeInTheDocument();
  });

  it('未加载文本时对比按钮禁用', () => {
    render(<VersionCompare />);
    expect(screen.getByRole('button', { name: '逐行对比' })).toBeDisabled();
  });

  it('加载示例并逐行对比，渲染双栏与增删统计', () => {
    render(<VersionCompare />);
    fireEvent.click(screen.getByRole('button', { name: '加载示例' }));
    fireEvent.click(screen.getByRole('button', { name: '逐行对比' }));

    const split = screen.getByTestId('diff-split');
    expect(split).toBeInTheDocument();
    expect(screen.getByText('旧版本')).toBeInTheDocument();
    expect(screen.getByText('新版本')).toBeInTheDocument();
    // 新增行：第二场追光
    expect(screen.getByText(/林导演：这里加一个追光/)).toBeInTheDocument();
    // 删除行：冷白色
    expect(screen.getByText(/林导演：开场灯光用冷白色/)).toBeInTheDocument();
    // 统计数字
    expect(screen.getByText(/新增/)).toBeInTheDocument();
  });

  it('返回按钮触发 onBack', () => {
    const onBack = vi.fn();
    render(<VersionCompare onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
