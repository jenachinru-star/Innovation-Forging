import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createPlan } from './store/plan.js';

const mocks = vi.hoisted(() => {
  const state = {
    loadResult: null,
    parseResult: null,
    saveProject: null,
    parseScript: null,
  };
  state.saveProject = vi.fn(async () => {});
  state.parseScript = vi.fn(async () => state.parseResult);
  return state;
});

vi.mock('./engine/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    parseScript: mocks.parseScript,
    generateScript: vi.fn(async () => ({ scriptText: '' })),
    extractUpload: vi.fn(),
    getSourceMode: () => 'local',
  };
});

vi.mock('./store/project.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadProject: vi.fn(async () => mocks.loadResult),
    saveProject: mocks.saveProject,
  };
});

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
    cues: [
      {
        id: 'cue-1',
        department: 'lighting',
        sceneId: 'sc-1',
        sceneNumber: 1,
        trigger: { type: 'line', quote: '你终于回来了' },
        content: '暖光渐亮',
        status: 'draft',
        note: '',
      },
    ],
  };
}

beforeEach(() => {
  mocks.loadResult = null;
  mocks.parseResult = null;
  mocks.saveProject.mockClear();
  mocks.parseScript.mockClear();
});

describe('App 集成', () => {
  it('确认新解析后对已删除的绑定台词记录 cue 类影响', async () => {
    mocks.loadResult = {
      step: 'confirm',
      scriptText: '老陈：你终于回来了',
      scriptData: scriptDataWith('你终于回来了'),
      plan: planWithCue(),
    };
    mocks.parseResult = { scriptData: scriptDataWith('爸，我回来了') };

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '确认，下一步' }));

    fireEvent.click(await screen.findByText('排练与影响'));

    expect(
      await screen.findByText('该提示绑定的台词在新版剧本中已不存在')
    ).toBeInTheDocument();
  });

  it('把 plan.briefs 传给节奏时间线', async () => {
    mocks.loadResult = {
      step: 'result',
      scriptText: '',
      scriptData: scriptDataWith('你终于回来了'),
      plan: {
        ...createPlan('stage', '测试方案'),
        briefs: [
          {
            id: 'brief-1',
            department: 'music',
            sceneNumber: 1,
            original: '音乐渐入',
            items: ['音乐渐入'],
            uncertain: [],
            status: 'draft',
            dueDate: '2026-11-30',
          },
        ],
      },
    };

    render(<App />);

    expect(await screen.findByTestId('cadence-brief')).toHaveTextContent('音乐渐入');
  });

  it('恢复完成并修改剧本文本后会触发保存', async () => {
    mocks.loadResult = {
      step: 'confirm',
      scriptText: '原文',
      scriptData: scriptDataWith('你终于回来了'),
      plan: createPlan('stage', '测试方案'),
    };

    render(<App />);

    const textarea = await screen.findByDisplayValue('原文');
    fireEvent.change(textarea, { target: { value: '新的剧本文本' } });

    await waitFor(() => {
      const states = mocks.saveProject.mock.calls.map(([state]) => state);
      expect(
        states.some((state) => state && state.step === 'confirm' && state.scriptText === '新的剧本文本')
      ).toBe(true);
    });
  });
});
