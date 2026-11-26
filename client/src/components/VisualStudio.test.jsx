import { describe, it, expect, vi, afterEach } from 'vitest';
import { useReducer } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
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
  it('数据：10 个风格族与 3 位导演参照', () => {
    expect(STYLE_FAMILIES).toHaveLength(10);
    expect(DIRECTOR_STYLES).toHaveLength(3);
  });

  it('默认进入视觉圣经，渲染四个区块', () => {
    render(<Harness />);
    expect(screen.getByText('视觉风格')).toBeInTheDocument();
    expect(screen.getByText('配色比例')).toBeInTheDocument();
    expect(screen.getByText('导演参照')).toBeInTheDocument();
    expect(screen.getByText('生成目标')).toBeInTheDocument();
  });

  it('渲染风格族卡片，默认选中电影感写实', () => {
    render(<Harness />);
    const card = screen.getByRole('button', { name: /电影感写实/ });
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
    const vintage = screen.getByRole('button', { name: /复古胶片/ });
    fireEvent.click(vintage);
    expect(vintage).toHaveClass('is-active');
  });

  it('点目标卡选中镜头视频', () => {
    render(<Harness />);
    const video = screen.getByRole('button', { name: /镜头视频/ });
    fireEvent.click(video);
    expect(video).toHaveClass('is-active');
  });

  it('点导演卡选中并可取消', () => {
    render(<Harness />);
    const villeneuve = screen.getByRole('button', { name: /维伦纽瓦/ });
    fireEvent.click(villeneuve);
    expect(villeneuve).toHaveClass('is-active');
    fireEvent.click(villeneuve);
    expect(villeneuve).not.toHaveClass('is-active');
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

  it('工作台不再展示结构化提示词 JSON 预览', () => {
    render(<Harness />);
    goWorkbench();
    expect(screen.queryByText('结构化提示词')).not.toBeInTheDocument();
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

  function stubVideoApi(statusSequence) {
    let pollCount = 0;
    const fetchMock = vi.fn(async (url, opts) => {
      if (opts?.method === 'POST') {
        return { ok: true, status: 202, json: async () => ({ taskId: 'cgt-x', status: 'queued' }) };
      }
      const status = statusSequence[Math.min(pollCount, statusSequence.length - 1)];
      pollCount += 1;
      return { ok: true, status: 200, json: async () => ({ status }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    return () => fetchMock.mock.calls.filter(([, o]) => o?.method !== 'POST').length;
  }

  async function startVideo() {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /镜头视频/ }));
    goWorkbench();
    fireEvent.change(screen.getByLabelText('画面描述'), { target: { value: '镜头缓缓推进' } });
    await act(async () => {
      fireEvent.click(screen.getByText('生成').closest('button'));
    });
  }

  it('上游返回 cancelled 等未知终态时停止轮询，不再持续请求', async () => {
    vi.useFakeTimers();
    const pollCalls = stubVideoApi(['running', 'cancelled']);
    await startVideo();

    for (let i = 0; i < 6; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
    }
    expect(pollCalls()).toBe(2);
    expect(screen.getByText('任务已结束，未生成视频')).toBeInTheDocument();
  }, 10000);

  it('轮询请求返回失败状态码时停止，且 assets 变化不会重新拉起轮询', async () => {
    vi.useFakeTimers();
    let polls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, opts) => {
        if (opts?.method === 'POST') {
          return { ok: true, status: 202, json: async () => ({ taskId: 'cgt-x', status: 'queued' }) };
        }
        polls += 1;
        return { ok: false, status: 500, json: async () => ({ error: '上游异常' }) };
      })
    );
    await startVideo();

    for (let i = 0; i < 6; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
    }
    expect(polls).toBe(1);
  }, 10000);

  it('组件卸载后不再请求、不再派发', async () => {
    vi.useFakeTimers();
    const pollCalls = stubVideoApi(['running']);
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /镜头视频/ }));
    goWorkbench();
    fireEvent.change(screen.getByLabelText('画面描述'), { target: { value: '镜头缓缓推进' } });
    await act(async () => {
      fireEvent.click(screen.getByText('生成').closest('button'));
    });
    cleanup();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(pollCalls()).toBe(0);
  }, 10000);
});
