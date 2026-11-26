import { useEffect, useState } from 'react';
import Storyboard from './Storyboard.jsx';
import CharacterArc from './CharacterArc.jsx';
import ConflictBoard from './ConflictBoard.jsx';
import RehearsalCalendar from './RehearsalCalendar.jsx';
import CallSheet from './CallSheet.jsx';
import {
  buildShots,
  buildCharacterArcs,
  buildConflicts,
} from '@director/shared/rules/coreDesk.js';

const TABS = [
  { id: 'storyboard', label: '分镜故事板' },
  { id: 'arc', label: '角色弧光' },
  { id: 'conflict', label: '矛盾冲突' },
  { id: 'calendar', label: '排练日历' },
  { id: 'callsheet', label: '通告单' },
];

export default function CoreDesk({ scriptData, plan, dispatch }) {
  const [tab, setTab] = useState('storyboard');

  // 首次进入时派生默认数据，已有则不覆盖用户编辑
  useEffect(() => {
    if (!Array.isArray(plan?.shots)) {
      dispatch({ type: 'setShots', shots: buildShots(scriptData) });
    }
  }, [plan?.shots, scriptData, dispatch]);

  useEffect(() => {
    if (!Array.isArray(plan?.characterArcs)) {
      dispatch({ type: 'setCharacterArcs', arcs: buildCharacterArcs(scriptData) });
    }
  }, [plan?.characterArcs, scriptData, dispatch]);

  useEffect(() => {
    if (!Array.isArray(plan?.conflicts)) {
      dispatch({ type: 'setConflicts', conflicts: buildConflicts(scriptData) });
    }
  }, [plan?.conflicts, scriptData, dispatch]);

  return (
    <div className="core-desk" data-testid="core-desk">
      <div className="core-head">
        <div className="core-head-text">
          <span className="eyebrow">CORE DESK</span>
          <h2 className="core-title">核心档</h2>
        </div>
        <nav className="core-tabs" role="tablist" aria-label="核心档模块">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`core-tab ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="core-body">
        {tab === 'storyboard' && (
          <Storyboard scriptData={scriptData} plan={plan} dispatch={dispatch} />
        )}
        {tab === 'arc' && (
          <CharacterArc scriptData={scriptData} plan={plan} dispatch={dispatch} />
        )}
        {tab === 'conflict' && (
          <ConflictBoard scriptData={scriptData} plan={plan} dispatch={dispatch} />
        )}
        {tab === 'calendar' && (
          <RehearsalCalendar scriptData={scriptData} plan={plan} dispatch={dispatch} />
        )}
        {tab === 'callsheet' && (
          <CallSheet scriptData={scriptData} plan={plan} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}
