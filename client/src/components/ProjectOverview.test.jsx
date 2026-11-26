import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ProjectOverview from './ProjectOverview.jsx';

function buildScriptData() {
  const scenes = Array.from({ length: 8 }, (_, index) => ({
    id: `sc-${index + 1}`,
    sceneNumber: index + 1,
    title: `场次 ${index + 1}`,
    location: index % 2 === 0 ? '客厅' : '庭院',
    actId: index < 4 ? 'act-1' : 'act-2',
    structure: index < 4 ? '第一幕' : '第二幕',
    estimatedMinutes: 4,
  }));
  const characters = Array.from({ length: 7 }, (_, index) => ({
    id: `ch-${index + 1}`,
    name: `角色${index + 1}`,
  }));
  return {
    summary: '一个关于重逢与抉择的故事。',
    scenes,
    characters,
    acts: [
      { id: 'act-1', actNumber: 1, title: '第一幕 · 起', sceneIds: ['sc-1', 'sc-2', 'sc-3', 'sc-4'] },
      { id: 'act-2', actNumber: 2, title: '第二幕 · 承', sceneIds: ['sc-5', 'sc-6', 'sc-7', 'sc-8'] },
    ],
  };
}

function buildPlan() {
  return {
    name: '重逢之夜',
    segments: [{ id: 'seg-1' }],
    briefs: [
      { id: 'br-1', status: 'needsReview' },
      { id: 'br-2', status: 'confirmed' },
    ],
    impacts: [{ id: 'im-1', status: 'open' }],
    staging: { placements: [{ id: 'pl-1' }] },
    rehearsals: [{ id: 'rh-1' }],
    assets: [{ id: 'as-1' }],
    style: { id: 'style-1' },
    discussions: [
      { id: 'ds-1', status: 'done', title: '开场调度讨论', createdAt: '2026-11-20T10:00:00Z' },
      { id: 'ds-2', status: 'draft', title: '未完成讨论', createdAt: '2026-11-21T10:00:00Z' },
    ],
  };
}

describe('ProjectOverview 导演驾驶舱', () => {
  it('完整方案：用真实数据渲染各区块并支持导航', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <ProjectOverview
        scriptData={buildScriptData()}
        plan={buildPlan()}
        versions={[{ id: 'v-1' }, { id: 'v-2' }]}
        onNavigate={onNavigate}
      />
    );

    // 焦点 Hero：标题、阶段徽章、真实统计
    expect(screen.getByRole('heading', { name: '重逢之夜' })).toBeInTheDocument();
    expect(screen.getByText('一个关于重逢与抉择的故事。')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText('分钟')).toBeInTheDocument();
    // 待处理 = 1 个 open impact + 1 个 needsReview brief
    expect(screen.getByText('2')).toBeInTheDocument();

    // 制作进度四阶段
    expect(screen.getByRole('heading', { name: '制作进度' })).toBeInTheDocument();
    expect(
      within(container.querySelector('.ov3-progress')).getAllByText('已完成')
    ).toHaveLength(4);

    // 待办：点击直达对应模块
    const todo = screen.getByRole('button', { name: /待核实部门需求/ });
    fireEvent.click(todo);
    expect(onNavigate).toHaveBeenCalledWith('briefs');

    // 幕场结构：两幕，各 4 场，点击进入拆解
    expect(screen.getByRole('heading', { name: '幕场结构' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /第一幕 · 起/ })).toBeInTheDocument();
    expect(screen.getAllByText('4 场')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /第二幕 · 承/ }));
    expect(onNavigate).toHaveBeenCalledWith('breakdown');

    // 人物速览：7 个角色，点击进入人物关系
    expect(screen.getByRole('heading', { name: '人物速览' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /角色1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /角色7/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /角色3/ }));
    expect(onNavigate).toHaveBeenCalledWith('relations');

    // 最近动态：只显示 done 讨论，草稿不出现，并显示版本数
    expect(screen.getByRole('heading', { name: '最近动态' })).toBeInTheDocument();
    expect(screen.getByText('开场调度讨论')).toBeInTheDocument();
    expect(screen.queryByText('未完成讨论')).not.toBeInTheDocument();
    expect(screen.getByText('历史版本 2 个')).toBeInTheDocument();
  });

  it('空数据：不崩溃，显示待开始与兜底待办', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <ProjectOverview scriptData={{}} plan={{}} versions={[]} onNavigate={onNavigate} />
    );

    expect(screen.getByText('我的舞台方案')).toBeInTheDocument();
    expect(screen.getByText('待开始')).toBeInTheDocument();
    const stats = container.querySelectorAll('.ov3-hero-stat');
    expect(stats).toHaveLength(4);
    expect(within(stats[0]).getByText('0')).toBeInTheDocument();
    // 无视觉方向时待办提示确定视觉方向
    fireEvent.click(screen.getByRole('button', { name: /确定视觉方向/ }));
    expect(onNavigate).toHaveBeenCalledWith('visuals');
  });
});
