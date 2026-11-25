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

  it('待办转为排练待办，合并并保留已有项', () => {
    const plan = {
      rehearsals: [
        { notes: '', decisions: [], openQuestions: [], todos: [{ text: '已有待办', done: false }] },
      ],
      discussions: [
        {
          id: 'disc-a',
          title: 't',
          kind: 'text',
          createdAt: new Date().toISOString(),
          status: 'done',
          summary: { overview: '', decisions: [], todos: ['新待办'], changes: [], questions: [] },
        },
      ],
    };
    const { dispatch } = renderPanel(plan);
    fireEvent.click(screen.getByRole('button', { name: /转为排练待办/ }));

    const rehCall = dispatch.mock.calls.find((c) => c[0].type === 'setRehearsalNotes');
    expect(rehCall[0].payload.todos.map((t) => t.text)).toEqual(['已有待办', '新待办']);
    const mark = dispatch.mock.calls.find((c) => c[0].type === 'updateDiscussion');
    expect(mark[0].patch.converted.todos).toBe(true);
  });

  it('转换待办时对重复项去重', () => {
    const plan = {
      rehearsals: [{ todos: [{ text: '重复待办', done: false }] }],
      discussions: [
        {
          id: 'disc-b',
          title: 't',
          kind: 'text',
          createdAt: new Date().toISOString(),
          status: 'done',
          summary: { overview: '', decisions: [], todos: ['重复待办'], changes: [], questions: [] },
        },
      ],
    };
    const { dispatch } = renderPanel(plan);
    fireEvent.click(screen.getByRole('button', { name: /转为排练待办/ }));
    const rehCall = dispatch.mock.calls.find((c) => c[0].type === 'setRehearsalNotes');
    expect(rehCall[0].payload.todos).toHaveLength(1);
  });

  it('变更转为部门需求并按关键词推断部门', () => {
    const plan = {
      briefs: [],
      discussions: [
        {
          id: 'disc-c',
          title: 'c',
          kind: 'text',
          createdAt: new Date().toISOString(),
          status: 'done',
          summary: {
            overview: '',
            decisions: [],
            todos: [],
            changes: ['开场灯光改成暖金色'],
            questions: [],
          },
        },
      ],
    };
    const { dispatch } = renderPanel(plan);
    fireEvent.click(screen.getByRole('button', { name: /转为部门需求/ }));

    const addCalls = dispatch.mock.calls.filter((c) => c[0].type === 'addBrief');
    expect(addCalls.length).toBeGreaterThan(0);
    expect(addCalls[0][0].brief.department).toBe('lighting');
  });

  it('已转换的分组显示已转入且不再出现按钮', () => {
    const plan = {
      discussions: [
        {
          id: 'disc-d',
          title: 't',
          kind: 'text',
          createdAt: new Date().toISOString(),
          status: 'done',
          converted: { todos: true },
          summary: { overview: '', decisions: [], todos: ['x'], changes: [], questions: [] },
        },
      ],
    };
    renderPanel(plan);
    expect(screen.getByText(/已转入排练待办/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /转为排练待办/ })).not.toBeInTheDocument();
  });

  it('点击加载示例，离线插入完整纪要', () => {
    const { dispatch } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '加载示例' }));
    const add = dispatch.mock.calls.find((c) => c[0].type === 'addDiscussion');
    expect(add[0].discussion.summary.decisions.length).toBeGreaterThan(0);
    expect(add[0].discussion.status).toBe('done');
  });

  it('不支持录音时显示降级并引导改用文字', () => {
    renderPanel();
    fireEvent.click(screen.getByText('录音讨论'));
    expect(screen.getByText(/当前环境不支持录音/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '改用文字记录' }));
    expect(screen.getByPlaceholderText(/记录想法/)).toBeInTheDocument();
  });

  it('服务不可达时提交显示友好提示', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    renderPanel();
    fireEvent.click(screen.getByText('文字记录'));
    fireEvent.change(screen.getByPlaceholderText(/记录想法/), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: '提交并梳理' }));
    expect(await screen.findByText(/无法连接服务/)).toBeInTheDocument();
  });
});
