import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CoreDesk from './CoreDesk.jsx';
import { SAMPLE_SCRIPT_DATA } from '@director/shared/samples/oneAct.js';

const firstScene = SAMPLE_SCRIPT_DATA.scenes[0];

const fullPlan = {
  name: '测试剧',
  assets: [],
  rehearsals: [],
  callSheetNotes: {},
  shots: [
    {
      id: 'shot-1',
      sceneId: firstScene.id,
      sceneNumber: 1,
      shotNumber: 1,
      shotType: '中景',
      title: '客厅',
      description: '画面描述',
      dialogue: '你终于回来了。',
      assetId: '',
      durationSec: 0,
    },
  ],
  characterArcs: [{ id: 'arc-1', characterName: '老陈', beats: [] }],
  conflicts: [],
};

describe('CoreDesk', () => {
  it('首次进入时派生默认数据', () => {
    const dispatch = vi.fn();
    render(<CoreDesk scriptData={SAMPLE_SCRIPT_DATA} plan={{}} dispatch={dispatch} />);
    const types = dispatch.mock.calls.map((call) => call[0].type);
    expect(types).toContain('setShots');
    expect(types).toContain('setCharacterArcs');
    expect(types).toContain('setConflicts');
  });

  it('渲染 5 个子 tab 并可切换', () => {
    render(<CoreDesk scriptData={SAMPLE_SCRIPT_DATA} plan={fullPlan} dispatch={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByTestId('storyboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '排练日历' }));
    expect(screen.getByTestId('rehearsal-calendar')).toBeInTheDocument();
  });
});
