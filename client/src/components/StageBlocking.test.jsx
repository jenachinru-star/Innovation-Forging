import { describe, it, expect, vi } from 'vitest';
import { useReducer } from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import Konva from 'konva';
import StageBlocking from './StageBlocking.jsx';
import { createPlan, planReducer } from '../store/plan.js';

const characters = [
  { id: 'ch-老陈', name: '老陈' },
  { id: 'ch-阿岚', name: '阿岚' },
];

const scenes = [{ id: 'sc-1', sceneNumber: 1, lines: [] }];

function Harness() {
  const [plan, dispatch] = useReducer(planReducer, undefined, () =>
    createPlan('stage', '测试方案')
  );
  return (
    <StageBlocking
      characters={characters}
      scenes={scenes}
      sceneNumber={1}
      plan={plan}
      dispatch={dispatch}
    />
  );
}

// Konva 节点级断言辅助：角色不再是独立 DOM，统一经 Stage findOne 定位。
function currentStage() {
  return Konva.stages[Konva.stages.length - 1];
}
function actorNode(id) {
  return currentStage().find((node) => node.id() === `actor-${id}`)[0];
}

describe('StageBlocking', () => {
  it('渲染节点画布与出场人物', () => {
    render(<StageBlocking characters={characters} dispatch={() => {}} />);

    expect(screen.getByTestId('konva-stage-wrap')).toBeInTheDocument();
    const chen = actorNode('老陈');
    const lan = actorNode('阿岚');
    expect(chen).toBeTruthy();
    expect(lan).toBeTruthy();
    expect(chen.id()).toBe('actor-老陈');
  });

  it('拖动角色结束派发 setPlacement 且坐标为逻辑坐标', async () => {
    const dispatch = vi.fn();
    render(<StageBlocking characters={characters} dispatch={dispatch} />);
    const node = actorNode('老陈');

    await act(async () => {
      node.fire('dragstart');
      node.x(200);
      node.y(100);
      node.fire('dragend');
    });

    const call = dispatch.mock.calls.find(([action]) => action.type === 'setPlacement');
    expect(call).toBeTruthy();
    expect(call[0].placement.x).toBe(200);
    expect(call[0].placement.y).toBe(100);
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

  it('未绑定台词时 trigger 为 free', () => {
    const dispatch = vi.fn();
    render(<StageBlocking characters={characters} scenes={scenes} sceneNumber={1} dispatch={dispatch} />);

    fireEvent.click(screen.getByText('添加提示'));
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: '加定点' } });
    fireEvent.click(screen.getByText('确认添加'));

    const call = dispatch.mock.calls.find(([action]) => action.type === 'addCue');
    expect(call[0].cue.trigger).toEqual({ type: 'free', quote: '' });
  });

  it('添加提示后组件内列表立即出现该提示内容', () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('添加提示'));
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: '加定点' } });
    fireEvent.click(screen.getByText('确认添加'));

    expect(screen.getByTestId('cue-cue-1')).toBeInTheDocument();
    expect(screen.getByTestId('cue-cue-1').textContent).toContain('加定点');
    expect(screen.getByText('删除')).toBeInTheDocument();
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

    expect(actorNode('老陈#A')).toBeTruthy();
    expect(actorNode('老陈#B')).toBeTruthy();
  });

  it('切换场次后不复用上一场的拖动坐标，回落到默认位置', async () => {
    const twoScenes = [
      { id: 'sc-1', sceneNumber: 1, lines: [] },
      { id: 'sc-2', sceneNumber: 2, lines: [] },
    ];

    const { rerender } = render(
      <StageBlocking
        characters={characters}
        scenes={twoScenes}
        sceneNumber={1}
        dispatch={() => {}}
      />
    );

    const node = actorNode('老陈');
    await act(async () => {
      node.fire('dragstart');
      node.x(200);
      node.y(100);
      node.fire('dragmove');
      node.fire('dragend');
    });

    expect(actorNode('老陈').x()).toBe(200);
    expect(actorNode('老陈').y()).toBe(100);

    rerender(
      <StageBlocking
        characters={characters}
        scenes={twoScenes}
        sceneNumber={2}
        dispatch={() => {}}
      />
    );

    const switched = actorNode('老陈');
    expect(switched.x()).not.toBe(200);
    expect(switched.y()).not.toBe(100);
  });

  it('场次不匹配任何场时列表为空并说明当前场次无提示', () => {
    const plan = {
      cues: [
        {
          id: 'cue-1',
          department: 'lighting',
          sceneNumber: 1,
          content: '加定点',
          trigger: { type: 'free', quote: '' },
        },
      ],
    };

    render(
      <StageBlocking
        characters={characters}
        scenes={[{ id: 'sc-1', sceneNumber: 1, lines: [] }]}
        sceneNumber={99}
        plan={plan}
        dispatch={() => {}}
      />
    );

    expect(screen.queryByTestId('cue-cue-1')).not.toBeInTheDocument();
    expect(screen.getByText('当前场次无提示')).toBeInTheDocument();
  });

  it('可切换到共享位置数据的 3D 视图', () => {
    render(<StageBlocking characters={characters} dispatch={() => {}} />);
    fireEvent.click(screen.getByText('3D', { selector: 'button' }));
    expect(screen.getByTestId('actor-3d-老陈')).toBeInTheDocument();
    expect(screen.getByTestId('actor-3d-阿岚')).toBeInTheDocument();
    expect(screen.getByLabelText('三维白模预览')).toBeInTheDocument();
  });

  it('技术提示可以绑定到具体舞台动作', () => {
    const dispatch = vi.fn();
    const withDirection = [
      {
        id: 'sc-1',
        sceneNumber: 1,
        lines: [],
        stageDirections: ['老陈把钥匙放进阿岚手心'],
      },
    ];
    render(
      <StageBlocking
        characters={characters}
        scenes={withDirection}
        sceneNumber={1}
        dispatch={dispatch}
      />
    );
    fireEvent.click(screen.getByText('添加提示'));
    fireEvent.change(screen.getByLabelText('绑定动作'), {
      target: { value: '老陈把钥匙放进阿岚手心' },
    });
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: '定点打亮钥匙' } });
    fireEvent.click(screen.getByText('确认添加'));

    const call = dispatch.mock.calls.find(([action]) => action.type === 'addCue');
    expect(call[0].cue.trigger).toEqual({
      type: 'action',
      quote: '老陈把钥匙放进阿岚手心',
    });
  });

  it('道具子 Tab 下可向当前场次添加可编辑白模对象', () => {
    const dispatch = vi.fn();
    render(<StageBlocking characters={characters} scenes={scenes} sceneNumber={1} dispatch={dispatch} />);
    fireEvent.click(screen.getByRole('tab', { name: /道具/ }));
    fireEvent.change(screen.getByLabelText('添加白模对象'), { target: { value: 'chair' } });
    fireEvent.click(screen.getByText('放入舞台'));
    const call = dispatch.mock.calls.find(([action]) => action.type === 'addStageObject');
    expect(call[0].object.kind).toBe('chair');
    expect(call[0].object.sceneNumber).toBe(1);
  });

  it('开启轨迹记录后拖动演员会保存路径点', async () => {
    const dispatch = vi.fn();
    render(<StageBlocking characters={characters} dispatch={dispatch} />);
    fireEvent.click(screen.getByText('记录走位轨迹'));
    const node = actorNode('老陈');
    await act(async () => {
      node.fire('dragstart');
      node.x(240); node.y(180); node.fire('dragmove');
      node.x(280); node.y(210); node.fire('dragmove');
      node.fire('dragend');
    });

    const call = dispatch.mock.calls.find(([action]) => action.type === 'addPath');
    expect(call).toBeTruthy();
    expect(call[0].path.characterId).toBe('老陈');
    expect(call[0].path.points.length).toBeGreaterThan(1);
  });

  const planWithTimeline = {
    cues: [
      {
        id: 'cue-1',
        department: 'lighting',
        sceneNumber: 1,
        content: '定点光',
        status: 'confirmed',
        timecode: 35,
        trigger: { type: 'free', quote: '' },
      },
      {
        id: 'cue-2',
        department: 'music',
        sceneNumber: 1,
        content: '背景音乐起',
        status: 'draft',
        timecode: 70,
        trigger: { type: 'free', quote: '' },
      },
    ],
    staging: {
      stage: null,
      placements: [],
      objects: [],
      paths: [
        {
          id: 'path-1',
          sceneNumber: 1,
          characterId: '老陈',
          points: [
            { x: 100, y: 300 },
            { x: 400, y: 300 },
            { x: 700, y:300 },
          ],
        },
      ],
      notes: [],
    },
  };

  const sceneWithDirections = {
    id: 'sc-1',
    sceneNumber: 1,
    lines: [],
    stageDirections: ['老陈走向门口', '阿岚转身'],
  };

  function renderTimeline() {
    return render(
      <StageBlocking
        characters={characters}
        scenes={[sceneWithDirections]}
        sceneNumber={1}
        plan={planWithTimeline}
        dispatch={() => {}}
      />
    );
  }

  it('初始时间轴时钟为 hh:mm:ss，播放按钮为播放态', () => {
    renderTimeline();
    expect(screen.getByText('00:00:00 / 00:05:30')).toBeInTheDocument();
    expect(screen.getByLabelText('播放')).toBeInTheDocument();
  });

  it('点击前进5秒后时钟同步更新到 00:00:05', () => {
    renderTimeline();
    fireEvent.click(screen.getByLabelText('前进5秒'));
    expect(screen.getByText('00:00:05 / 00:05:30')).toBeInTheDocument();
  });

  it('拖动进度条越过 Cue 时间码后，该 Cue 标记为已触发', () => {
    renderTimeline();
    const cueRow = screen.getByTestId('cue-cue-1');
    expect(cueRow.classList.contains('is-fired')).toBe(false);

    fireEvent.change(screen.getByLabelText('时间轴进度'), { target: { value: '40' } });
    expect(screen.getByTestId('cue-cue-1').classList.contains('is-fired')).toBe(true);
  });

  it('seek 后演员沿记录路径移动到插值位置', () => {
    renderTimeline();
    const beforeX = actorNode('老陈').x();

    fireEvent.change(screen.getByLabelText('时间轴进度'), { target: { value: '165' } });
    const afterX = actorNode('老陈').x();

    expect(afterX).not.toBe(beforeX);
    expect(afterX).toBe(400);
  });

  it('切换到白模模式后角色底盘改为透明线框', () => {
    renderTimeline();
    const circle = () => actorNode('老陈').find('Circle')[0];
    expect(circle().fill()).not.toBe('transparent');

    fireEvent.click(screen.getByText('白模', { selector: 'button' }));
    expect(circle().fill()).toBe('transparent');
  });

  it('渲染六个舞台子 Tab，点击后切换激活态', () => {
    renderTimeline();
    const labels = ['舞台', '调度', '灯光', '音乐', '道具', '音效'];
    for (const label of labels) {
      expect(screen.getByRole('tab', { name: new RegExp(label) })).toBeInTheDocument();
    }
    const lightTab = screen.getByRole('tab', { name: /灯光/ });
    fireEvent.click(lightTab);
    expect(lightTab.getAttribute('aria-selected')).toBe('true');
  });

  it('渲染五个工具图标按钮', () => {
    renderTimeline();
    for (const label of ['网格', '对象', '列表', '编辑', '锁定']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('灯光/音乐子 Tab 过滤 Cue，数据不删除', () => {
    renderTimeline();
    expect(screen.getByTestId('cue-cue-1')).toBeInTheDocument();
    expect(screen.getByTestId('cue-cue-2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /灯光/ }));
    expect(screen.getByTestId('cue-cue-1')).toBeInTheDocument();
    expect(screen.queryByTestId('cue-cue-2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /音乐/ }));
    expect(screen.queryByTestId('cue-cue-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('cue-cue-2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /舞台/ }));
    expect(screen.getByTestId('cue-cue-1')).toBeInTheDocument();
    expect(screen.getByTestId('cue-cue-2')).toBeInTheDocument();
  });

  it('底部调度卡片在动作/走位/提示间切换并显示对应条目', () => {
    const { container } = renderTimeline();
    const card = container.querySelector('.dispatch-card');
    // 默认提示
    expect(card.textContent).toContain('定点光');

    fireEvent.click(screen.getByRole('tab', { name: /^动作$/ }));
    expect(within(card).getByText('老陈走向门口')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^走位$/ }));
    expect(within(card).getByText(/老陈 走位/)).toBeInTheDocument();
  });

  it('3D 视图渲染灯光氛围元素', () => {
    const { container } = renderTimeline();
    fireEvent.click(screen.getByText('3D', { selector: 'button' }));
    expect(container.querySelectorAll('.stage-light').length).toBe(2);
    expect(container.querySelectorAll('.stage-footlight').length).toBe(2);
    expect(container.querySelector('.stage-light-wash')).toBeTruthy();
  });

  it('锁定后拖动演员不派发 setPlacement', () => {
    const dispatch = vi.fn();
    render(
      <StageBlocking
        characters={characters}
        scenes={scenes}
        sceneNumber={1}
        dispatch={dispatch}
      />
    );
    fireEvent.click(screen.getByLabelText('锁定'));
    const node = actorNode('老陈');
    expect(node.draggable()).toBe(false);
    expect(dispatch.mock.calls.some(([action]) => action.type === 'setPlacement')).toBe(false);
  });

});
