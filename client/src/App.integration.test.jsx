import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createPlan } from './store/plan.js';

const state = vi.hoisted(() => ({
  initialRecord: null,
  saveProject: vi.fn(async () => ({})),
  parseScript: vi.fn(),
}));

vi.mock('./engine/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    parseScript: state.parseScript,
    generateScript: vi.fn(async () => ({ scriptText: '' })),
  };
});

vi.mock('./api/auth.js', () => ({
  currentUser: vi.fn(async () => ({ username: 'tester' })),
  logout: vi.fn(async () => {}),
}));

vi.mock('./api/projects.js', () => ({
  listProjects: vi.fn(async () => (state.initialRecord ? [state.initialRecord] : [])),
  getProject: vi.fn(async () => state.initialRecord),
  saveProject: state.saveProject,
  removeProject: vi.fn(async () => {}),
}));

import App from './App.jsx';

function scriptDataWith(lineText) {
  return {
    summary: '简介',
    scenes: [
      {
        id: 'sc-1',
        sceneNumber: 1,
        title: '第一场',
        location: '客厅',
        characters: ['老陈', '阿岚'],
        presentCharacters: ['老陈', '阿岚'],
        props: [],
        stageDirections: [],
        lines: [{ id: 'ln-1', speaker: '老陈', text: lineText }],
        summary: '',
        estimatedMinutes: 10,
      },
    ],
    characters: [
      { id: 'ch-1', name: '老陈' },
      { id: 'ch-2', name: '阿岚' },
    ],
    relationships: [],
    acts: [],
  };
}

function planWithCue() {
  return {
    ...createPlan('stage', '测试方案'),
    aiConsent: { text: true, authorizedAt: '2026-11-24T00:00:00.000Z' },
    cues: [
      {
        id: 'cue-1',
        department: 'lighting',
        sceneId: 'sc-1',
        sceneNumber: 1,
        anchor: null,
        trigger: { type: 'line', quote: '你终于回来了', offset: null },
        content: '暖光渐亮',
        status: 'draft',
        note: '',
      },
    ],
  };
}

beforeEach(() => {
  state.initialRecord = null;
  state.saveProject.mockClear();
  state.parseScript.mockReset();
});

describe('App 集成', () => {
  it('确认新解析后对已删除绑定台词的 cue 生成影响', async () => {
    state.initialRecord = {
      id: 'rec-1',
      step: 'confirm',
      scriptText: '老陈：你终于回来了',
      scriptData: scriptDataWith('你终于回来了'),
      plan: planWithCue(),
    };
    state.parseScript.mockResolvedValue({
      scriptData: scriptDataWith('爸，我回来了'),
      sourceMode: 'local',
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '没问题，开始排' }));

    fireEvent.click(await screen.findByText('排练与影响'));

    expect(
      await screen.findByText('该提示绑定的台词在新版剧本中已不存在')
    ).toBeInTheDocument();
  });

  it('把 plan.briefs 传给部门需求面板', async () => {
    state.initialRecord = {
      id: 'rec-2',
      step: 'result',
      activeNav: 'briefs',
      activeTab: 'briefs',
      scriptText: '',
      scriptData: scriptDataWith('你终于回来了'),
      plan: {
        ...createPlan('stage', '测试方案'),
        briefs: [
          {
            id: 'brief-1',
            department: 'music',
            sceneId: 'sc-1',
            sceneNumber: 1,
            cueId: null,
            original: '音乐渐入',
            items: ['音乐渐入'],
            uncertain: [],
            priority: 'medium',
            dueDate: '2026-11-30',
            status: 'draft',
            owner: '',
          },
        ],
      },
    };

    render(<App />);
    expect(await screen.findByText('音乐渐入')).toBeInTheDocument();
  });

  it('修改剧本文本后触发保存到后端', async () => {
    state.initialRecord = {
      id: 'rec-3',
      step: 'confirm',
      scriptText: '原文',
      scriptData: scriptDataWith('你终于回来了'),
      plan: createPlan('stage', '测试方案'),
    };

    render(<App />);

    const textarea = await screen.findByDisplayValue('原文');
    fireEvent.change(textarea, { target: { value: '新的剧本文本' } });

    await waitFor(() => {
      const records = state.saveProject.mock.calls.map(([, rec]) => rec);
      expect(
        records.some((rec) => rec && rec.step === 'confirm' && rec.scriptText === '新的剧本文本')
      ).toBe(true);
    });
  });
});
