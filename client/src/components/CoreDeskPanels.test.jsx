import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Storyboard from './Storyboard.jsx';
import RehearsalCalendar from './RehearsalCalendar.jsx';
import CallSheet from './CallSheet.jsx';
import { SAMPLE_SCRIPT_DATA } from '@director/shared/samples/oneAct.js';

const firstScene = SAMPLE_SCRIPT_DATA.scenes[0];

const plan = {
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
  characterArcs: [],
  conflicts: [],
};

describe('Storyboard', () => {
  it('渲染镜头卡片并可修改景别', () => {
    const dispatch = vi.fn();
    render(<Storyboard scriptData={SAMPLE_SCRIPT_DATA} plan={plan} dispatch={dispatch} />);
    expect(screen.getByTestId('shot-shot-1')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('景别'), { target: { value: '特写' } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateShot', id: 'shot-1' })
    );
  });

  it('点击删除触发 removeShot', () => {
    const dispatch = vi.fn();
    render(<Storyboard scriptData={SAMPLE_SCRIPT_DATA} plan={plan} dispatch={dispatch} />);
    fireEvent.click(screen.getByLabelText('删除镜头'));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'removeShot', id: 'shot-1' })
    );
  });
});

describe('RehearsalCalendar', () => {
  it('渲染月历并在点击日期后显示详情', () => {
    render(<RehearsalCalendar plan={plan} dispatch={() => {}} />);
    const cells = document.querySelectorAll('.cal-cell:not(.is-out)');
    expect(cells.length).toBeGreaterThan(20);
    fireEvent.click(cells[0]);
    expect(screen.getByTestId('cal-detail')).toBeInTheDocument();
  });
});

describe('CallSheet', () => {
  it('渲染通告单并显示在场人物', () => {
    render(<CallSheet scriptData={SAMPLE_SCRIPT_DATA} plan={plan} dispatch={() => {}} />);
    expect(screen.getByTestId('call-sheet')).toBeInTheDocument();
    expect(screen.getByText('测试剧 · 通告单')).toBeInTheDocument();
    expect(screen.getByText('老陈')).toBeInTheDocument();
  });

  it('编辑集合时间触发 setCallSheetNote', () => {
    const dispatch = vi.fn();
    render(<CallSheet scriptData={SAMPLE_SCRIPT_DATA} plan={plan} dispatch={dispatch} />);
    fireEvent.change(screen.getByLabelText('集合时间'), { target: { value: '09:00' } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setCallSheetNote' })
    );
  });
});
