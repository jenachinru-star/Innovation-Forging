import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiscussionPanel from '../components/DiscussionPanel.jsx';
import { planReducer } from '../store/plan.js';
import { createEmptyProductionPlan } from '@director/shared';

const summaryPayload = {
  transcript: '我们决定把开场改成暖光，并且周五前要确认服装。',
  summary: {
    overview: '本次讨论确定了开场灯光与服装时间。',
    decisions: ['开场改为暖光'],
    todos: ['周五前确认服装'],
    changes: [],
    questions: [],
  },
};

function renderPanel(plan = {}, dispatch = vi.fn()) {
  const onClose = vi.fn();
  const utils = render(
    <DiscussionPanel open plan={plan} onClose={onClose} dispatch={dispatch} />
  );
  return { ...utils, onClose, dispatch };
}

describe('讨论数据 reducer', () => {
  it('addDiscussion 生成默认字段并置于最前', () => {
    const initial = createEmptyProductionPlan('stage', '测试');
    const next = planReducer(initial, {
      type: 'addDiscussion',
      discussion: { title: '站会', kind: 'text', transcript: '内容' },
    });
    expect(next.discussions).toHaveLength(1);
    expect(next.discussions[0]).toMatchObject({
      id: 'disc-1',
      title: '站会',
      kind: 'text',
      status: 'draft',
    });
  });

  it('updateDiscussion 按 id 打补丁', () => {
    let state = planReducer(createEmptyProductionPlan('stage', 'x'), {
      type: 'addDiscussion',
      discussion: { title: 'a' },
    });
    state = planReducer(state, {
      type: 'updateDiscussion',
      id: 'disc-1',
      patch: { status: 'done', summary: { overview: '概览' } },
    });
    expect(state.discussions[0].status).toBe('done');
    expect(state.discussions[0].summary.overview).toBe('概览');
  });

  it('removeDiscussion 按 id 删除', () => {
    let state = planReducer(createEmptyProductionPlan('stage', 'x'), {
      type: 'addDiscussion',
      discussion: { title: 'a' },
    });
    state = planReducer(state, { type: 'removeDiscussion', id: 'disc-1' });
    expect(state.discussions).toHaveLength(0);
  });
});

describe('DiscussionPanel 抽屉', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => summaryPayload,
    }));
  });

  it('打开后显示标题与两个模式入口', () => {
    renderPanel();
    expect(screen.getByRole('complementary', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'false'
    );
    expect(screen.getByText('讨论与复盘')).toBeInTheDocument();
    expect(screen.getByText('录音讨论')).toBeInTheDocument();
    expect(screen.getByText('文字记录')).toBeInTheDocument();
  });

  it('无历史时显示空态提示', () => {
    renderPanel();
    expect(screen.getByText(/还没有讨论记录/)).toBeInTheDocument();
  });

  it('点击关闭按钮触发 onClose', () => {
    const { onClose } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('文字提交后调用接口并渲染结构化纪要', async () => {
    const { dispatch } = renderPanel();
    fireEvent.click(screen.getByText('文字记录'));
    const textarea = screen.getByPlaceholderText(/记录想法/);
    fireEvent.change(textarea, { target: { value: '开场改暖光，周五确认服装' } });
    fireEvent.click(screen.getByRole('button', { name: '提交并梳理' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe('POST');

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'addDiscussion' })
      );
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateDiscussion' })
    );
  });

  it('已有纪要的历史记录渲染决策与待办标签', () => {
    const plan = {
      discussions: [
        {
          id: 'disc-9',
          title: '历史讨论',
          kind: 'text',
          createdAt: new Date().toISOString(),
          durationSec: 0,
          transcript: summaryPayload.transcript,
          status: 'done',
          summary: summaryPayload.summary,
        },
      ],
    };
    renderPanel(plan);
    expect(screen.getByText('历史讨论')).toBeInTheDocument();
    expect(screen.getByText('开场改为暖光')).toBeInTheDocument();
    expect(screen.getByText('周五前确认服装')).toBeInTheDocument();
  });
});
