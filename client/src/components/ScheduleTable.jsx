import { useState } from 'react';

const RHYTHM_OPTIONS = ['铺垫', '转折', '结尾', '高潮'];

// 把分钟（可为小数）格式化为 m'ss" 分秒时长
export function formatClock(totalMinutes) {
  const safe = Number(totalMinutes);
  const value = Number.isFinite(safe) && safe > 0 ? safe : 0;
  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 60);
  return `${minutes}'${String(seconds).padStart(2, '0')}"`;
}

function joinList(list) {
  return (list || []).filter(Boolean).join('、');
}

export default function ScheduleTable({ scriptData, onChangeScene }) {
  const scenes = scriptData?.scenes || [];
  const [expanded, setExpanded] = useState(null);
  const editable = typeof onChangeScene === 'function';

  function toggle(index) {
    setExpanded((prev) => (prev === index ? null : index));
  }

  return (
    <div>
      {scriptData?.summary && (
        <p className="card mb-4 rounded-md p-3 text-sm">{scriptData.summary}</p>
      )}
      {scenes.length === 0 ? (
        <p className="muted text-sm">未解析到场次信息。</p>
      ) : (
        <div className="table-card overflow-x-auto">
          <table className="paper-table schedule-table text-left text-sm">
            <thead>
              <tr>
                <th className="col-index">场次</th>
                <th>标题</th>
                <th>地点</th>
                <th>出场人物</th>
                <th>道具</th>
                <th className="col-time">时长</th>
                <th className="col-rhythm">节奏</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene, idx) => {
                const isOpen = expanded === idx;
                const rhythm = scene.structure || '';
                return (
                  <SceneRows
                    key={`${scene.sceneNumber}-${scene.title}`}
                    scene={scene}
                    index={idx}
                    isOpen={isOpen}
                    editable={editable}
                    rhythm={rhythm}
                    onToggle={() => toggle(idx)}
                    onChangeScene={onChangeScene}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SceneRows({ scene, index, isOpen, editable, rhythm, onToggle, onChangeScene }) {
  const hasExtra =
    (scene.presentCharacters?.length || 0) > 0 ||
    (scene.stageDirections?.length || 0) > 0 ||
    Boolean(scene.summary);

  return (
    <>
      <tr className="schedule-row align-top">
        <td className="col-index">
          <button
            type="button"
            className={'row-expand' + (isOpen ? ' is-open' : '')}
            aria-label={isOpen ? '收起详情' : '展开详情'}
            aria-expanded={isOpen}
            onClick={onToggle}
            disabled={!hasExtra}
          >
            <span className="row-expand-chevron" aria-hidden="true">
              ›
            </span>
            <span className="row-index-num">{scene.sceneNumber}</span>
          </button>
        </td>
        <td className="whitespace-nowrap">{scene.title || `第 ${scene.sceneNumber} 场`}</td>
        <td>
          {editable ? (
            <input
              value={scene.location ?? ''}
              onChange={(e) => onChangeScene(index, { location: e.target.value })}
              className="cell-input w-full"
              aria-label="编辑地点"
            />
          ) : (
            scene.location
          )}
        </td>
        <td>{joinList(scene.characters)}</td>
        <td>{joinList(scene.props)}</td>
        <td className="whitespace-nowrap col-time">
          {editable ? (
            <span className="time-edit">
              <input
                type="number"
                min="0"
                value={scene.estimatedMinutes ?? 0}
                onChange={(e) =>
                  onChangeScene(index, { estimatedMinutes: Number(e.target.value) })
                }
                className="cell-input time-min-input"
                aria-label="编辑时长（分钟）"
              />
              <span className="time-clock">{formatClock(scene.estimatedMinutes)}</span>
            </span>
          ) : (
            <span className="time-clock">{formatClock(scene.estimatedMinutes)}</span>
          )}
        </td>
        <td className="col-rhythm">
          <select
            value={rhythm}
            onChange={(e) => onChangeScene?.(index, { structure: e.target.value })}
            className={'rhythm-select' + (rhythm ? ` is-rhythm-${rhythm}` : '')}
            disabled={!editable}
            aria-label="选择节奏"
          >
            <option value="">未标注</option>
            {RHYTHM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </td>
      </tr>

      {isOpen && (
        <tr className="schedule-extra-row">
          <td colSpan={7}>
            <div className="schedule-extra">
              <div className="schedule-extra-item">
                <span className="schedule-extra-label">在场人物</span>
                <span>{joinList(scene.presentCharacters) || '—'}</span>
              </div>
              <div className="schedule-extra-item">
                <span className="schedule-extra-label">舞台说明</span>
                <span>{joinList(scene.stageDirections) || '—'}</span>
              </div>
              <div className="schedule-extra-item schedule-extra-summary">
                <span className="schedule-extra-label">剧情摘要</span>
                {editable ? (
                  <input
                    value={scene.summary ?? ''}
                    onChange={(e) => onChangeScene(index, { summary: e.target.value })}
                    className="cell-input w-full"
                    aria-label="编辑剧情摘要"
                  />
                ) : (
                  <span>{scene.summary || '—'}</span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
