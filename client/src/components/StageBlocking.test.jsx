import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageBlocking from './StageBlocking.jsx';

const characters = [
  { id: 'ch-老陈', name: '老陈' },
  { id: 'ch-阿岚', name: '阿岚' },
];

function rect() {
  return { left: 0, top: 0, width: 800, height: 480, right: 800, bottom: 480 };
}

describe('StageBlocking', () => {
  it('渲染舞台画布与出场人物名称', () => {
    render(<StageBlocking characters={characters} dispatch={() => {}} />);

    expect(screen.getByTestId('stage-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('actor-老陈')).toBeInTheDocument();
    expect(screen.getByTestId('actor-阿岚')).toBeInTheDocument();
    expect(screen.getByTestId('actor-老陈').textContent).toContain('老陈');
  });

  it('拖动角色后在松手时派发 setPlacement 且坐标有限', () => {
    const dispatch = vi.fn();
    render(<StageBlocking characters={characters} dispatch={dispatch} />);

    const svg = screen.getByTestId('stage-canvas');
    Object.defineProperty(svg, 'getBoundingClientRect', { value: rect });

    fireEvent.pointerDown(screen.getByTestId('actor-老陈'));
    fireEvent.pointerMove(svg, { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(svg);

    const call = dispatch.mock.calls.find(([action]) => action.type === 'setPlacement');
    expect(call).toBeTruthy();
    expect(Number.isFinite(call[0].placement.x)).toBe(true);
    expect(Number.isFinite(call[0].placement.y)).toBe(true);
  });

  it('添加提示时派发 addCue 并带上部门', () => {
    const dispatch = vi.fn();
    render(<StageBlocking characters={characters} dispatch={dispatch} />);

    fireEvent.click(screen.getByText('添加提示'));
    fireEvent.change(screen.getByLabelText('部门'), { target: { value: 'lighting' } });
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: '加定点' } });
    fireEvent.click(screen.getByText('确认添加'));

    const call = dispatch.mock.calls.find(([action]) => action.type === 'addCue');
    expect(call).toBeTruthy();
    expect(call[0].cue.department).toBe('lighting');
    expect(call[0].cue.content).toBe('加定点');
  });

  it('绑定台词下拉读取场景 lines，选项文本为 speaker：text、value 为 text', () => {
    const scenes = [
      {
        id: 'sc-1',
        sceneNumber: 1,
        lines: [
          { id: 'ln-1', speaker: '老陈', text: '你终于回来了。' },
          { id: 'ln-2', speaker: '阿岚', text: '爸，我回来了。' },
        ],
      },
    ];

    render(
      <StageBlocking
        characters={characters}
        scenes={scenes}
        sceneNumber={1}
        dispatch={() => {}}
      />
    );

    fireEvent.click(screen.getByText('添加提示'));
    const select = screen.getByLabelText('绑定台词');
    const options = Array.from(select.querySelectorAll('option'));
    const match = options.find((option) => option.textContent.includes('你终于回来了'));

    expect(match).toBeTruthy();
    expect(match.value).toBe('你终于回来了。');
    expect(match.textContent).toBe('老陈：你终于回来了。');
  });

  it('同时挂多名演员的 AB 角渲染独立标记', () => {
    render(
      <StageBlocking
        characters={[{ id: 'ch-老陈', name: '老陈' }]}
        plan={{ cast: { 老陈: ['演员A', '演员B'] } }}
        dispatch={() => {}}
      />
    );

    expect(screen.getByTestId('actor-老陈#A')).toBeInTheDocument();
    expect(screen.getByTestId('actor-老陈#B')).toBeInTheDocument();
  });
});
