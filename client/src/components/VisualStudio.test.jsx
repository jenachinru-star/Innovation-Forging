import { describe, it, expect, vi, afterEach } from 'vitest';
import { useReducer } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import VisualStudio from './VisualStudio.jsx';
import { createPlan, planReducer } from '../store/plan.js';
import { DIRECTOR_STYLES, STYLE_FAMILIES } from '../data/styles.js';

function Harness() {
  const [plan, dispatch] = useReducer(planReducer, undefined, () =>
    createPlan('stage', '测试方案')
  );
  return <VisualStudio scriptData={{ characters: [] }} plan={plan} dispatch={dispatch} />;
}

function goWorkbench() {
  fireEvent.click(screen.getByRole('tab', { name: '生成工作台' }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('VisualStudio', () => {
  it('数据：10 个风格族与 24 位导演', () => {
    expect(STYLE_FAMILIES).toHaveLength(10);
    expect(DIRECTOR_STYLES).toHaveLength(24);
  });

  it('默认进入视觉圣经，渲染四个区块', () => {
    render(<Harness />);
    expect(screen.getByText('视觉风格')).toBeInTheDocument();
    expect(screen.getByText('配色比例')).toBeInTheDocument();
    expect(screen.getByText('导演参照')).toBeInTheDocument();
    expect(screen.getByText('生成目标')).toBeInTheDocument();
  });

  it('渲染风格族卡片，默认选中冷调惊悚', () => {
    render(<Harness />);
    const card = screen.getByRole('button', { name: /冷调惊悚/ });
    expect(card).toHaveClass('is-active');
  });

  it('子 Tab 切换：工作台显示生成条，再切回圣经', () => {
    render(<Harness />);
    expect(screen.queryByLabelText('画面描述')).not.toBeInTheDocument();
    goWorkbench();
    expect(screen.getByLabelText('画面描述')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '视觉圣经' }));
    expect(screen.queryByLabelText('画面描述')).not.toBeInTheDocument();
  });

  it('点风格卡切换风格并持久化', () => {
    render(<Harness />);
    const earth = screen.getByRole('button', { name: /自然诗意/ });
    fireEvent.click(earth);
    expect(earth).toHaveClass('is-active');
  });

  it('点目标卡选中镜头视频', () => {
    render(<Harness />);
    const video = screen.getByRole('button', { name: /镜头视频/ });
    fireEvent.click(video);
    expect(video).toHaveClass('is-active');
  });

  it('点导演卡选中并可取消', () => {
    render(<Harness />);
    const hitch = screen.getByRole('button', { name: /希区柯克/ });
    fireEvent.click(hitch);
    expect(hitch).toHaveClass('is-active');
    fireEvent.click(hitch);
    expect(hitch).not.toHaveClass('is-active');
  });

  it('工作台图片生成成功：loading 后新增卡片', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ imageUrl: 'http://new/1.png' }),
      }))
    );
    render(<Harness />);
    goWorkbench();
    fireEvent.change(screen.getByLabelText('画面描述'), {
      target: { value: '雨夜小巷' },
    });
    fireEvent.click(screen.getByText('生成').closest('button'));
    expect(screen.getByTestId('visual-loading')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('visual-card-asset-1')).toBeInTheDocument()
    );
  });

  it('工作台生成失败显示友好错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 502,
        json: async () => ({ error: '生成失败' }),
      }))
    );
    render(<Harness />);
    goWorkbench();
    fireEvent.change(screen.getByLabelText('画面描述'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('生成').closest('button'));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('生成失败')
    );
  });

  it('工作台保留结构化提示词与复制按钮', () => {
    render(<Harness />);
    goWorkbench();
    expect(screen.getByText('结构化提示词')).toBeInTheDocument();
    expect(screen.getByText('复制提示词')).toBeInTheDocument();
  });

  it('只读模式：子 Tab 可切换，但写操作全部禁用', () => {
    const plan = createPlan('stage', '只读方案');
    render(
      <VisualStudio
        scriptData={{ characters: [] }}
        plan={plan}
        dispatch={vi.fn()}
        readOnly
      />
    );
    // 圣经内的写操作按钮禁用
    expect(screen.getByRole('button', { name: /冷调惊悚/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /希区柯克/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /镜头视频/ })).toBeDisabled();
    // 子 Tab 仍可自由切换
    fireEvent.click(screen.getByRole('tab', { name: '生成工作台' }));
    expect(screen.getByLabelText('画面描述')).toBeDisabled();
    expect(screen.getByText('生成').closest('button')).toBeDisabled();
    // 复制提示词为只读信息，仍可用
    expect(screen.getByText('复制提示词')).toBeEnabled();
  });
});

describe('视频生成与轮询', () => {
  it('选中镜头视频后创建任务，轮询到可播放', async () => {
    vi.useFakeTimers();
    let pollCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, opts) => {
        if (opts?.method === 'POST') {
          return {
            ok: true,
            status: 202,
            json: async () => ({ taskId: 'cgt-x', status: 'queued' }),
          };
        }
        pollCount += 1;
        const done = pollCount >= 2;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: done ? 'succeeded' : 'running',
            videoUrl: done ? 'http://v/1.mp4' : '',
          }),
        };
      })
    );

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /镜头视频/ }));
    goWorkbench();
    fireEvent.change(screen.getByLabelText('画面描述'), {
      target: { value: '镜头缓缓推进' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('生成').closest('button'));
    });
    expect(screen.getByTestId('video-card-asset-1')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      screen.getByTestId('video-card-asset-1').querySelector('video')
    ).toBeInTheDocument();
  }, 10000);
});
