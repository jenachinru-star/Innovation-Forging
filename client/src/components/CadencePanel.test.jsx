import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CadencePanel from './CadencePanel.jsx';

const scenes = [
  { sceneNumber: 1, title: '序幕：舞台之外', estimatedMinutes: 6, structure: '铺垫' },
  { sceneNumber: 2, title: '第一幕：邀约', estimatedMinutes: 8, structure: '铺垫' },
  { sceneNumber: 3, title: '第二幕：分歧', estimatedMinutes: 7, structure: '转折' },
];

describe('CadencePanel', () => {
  it('渲染标题、每个场次节点与底部文案', () => {
    render(<CadencePanel scenes={scenes} />);
    expect(screen.getByText('剧作节奏')).toBeInTheDocument();
    const dots = screen.getAllByRole('button');
    expect(dots).toHaveLength(3);
    // 短标题取冒号后的部分
    expect(screen.getByText('舞台之外')).toBeInTheDocument();
    expect(screen.getByText('邀约')).toBeInTheDocument();
    expect(screen.getByText('一场戏的节奏，决定观众的呼吸')).toBeInTheDocument();
  });

  it('节点按节奏着色', () => {
    render(<CadencePanel scenes={scenes} />);
    const dots = screen.getAllByRole('button');
    // 铺垫 → 绛红，转折 → 金
    expect(dots[0].style.backgroundColor).toBe('var(--accent-seal)');
    expect(dots[2].style.backgroundColor).toBe('var(--cue)');
  });

  it('点击节点循环切换节奏并回写', () => {
    const onChange = vi.fn();
    render(<CadencePanel scenes={scenes} onChange={onChange} />);
    const dots = screen.getAllByRole('button');
    // 第一个节点当前是“铺垫”，再点一次 → 转折
    fireEvent.click(dots[0]);
    expect(onChange).toHaveBeenCalledWith(0, { structure: '转折' });
  });

  it('未标注节奏的节点点击后变为铺垫', () => {
    const onChange = vi.fn();
    const unmarked = [
      { sceneNumber: 1, title: '第一场', estimatedMinutes: 5, structure: '' },
    ];
    render(<CadencePanel scenes={unmarked} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(0, { structure: '铺垫' });
  });

  it('空场次显示空态', () => {
    render(<CadencePanel scenes={[]} />);
    expect(screen.getByText('暂无可展示的场次。')).toBeInTheDocument();
  });
});
