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

// 出场人物：优先“在场人物”（含不说话的在场者），回退有台词人物
function presentList(scene) {
  const present = scene.presentCharacters;
  if (Array.isArray(present) && present.length) return present;
  return scene.characters || [];
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
                <th className="col-location">地点</th>
                <th>出场人物</th>
                <th className="col-time">时长</th>
                <th className="col-rhythm">节奏</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene, idx) => (
                <SceneRows
                  key={`${scene.sceneNumber}-${scene.id}`}
                  scene={scene}
                  index={idx}
                  isOpen={expanded === idx}
                  editable={editable}
                  onToggle={() => toggle(idx)}
                  onChangeScene={onChangeScene}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SceneRows({ scene, index, isOpen, editable, onToggle, onChangeScene }) {
  const rhythm = scene.structure || '';
  const missingLocation = !scene.location;
  const hasExtra =
    (scene.presentCharacters?.length || 0) ||
    (scene.stageDirections?.length || 0) ||
    Boolean(scene.summary) ||
    Boolean(scene.note);

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
        <td className="col-location">
          {editable ? (
            <input
              value={scene.location ?? ''}
              onChange={(e) => onChangeScene(index, { location: e.target.value })}
              className={'cell-input location-input' + (missingLocation ? ' is-missing' : '')}
              placeholder="待补地点？"
              aria-label="编辑地点"
            />
          ) : missingLocation ? (
            <span className="location-missing">待补 ?</span>
          ) : (
            <span>{scene.location}</span>
          )}
        </td>
        <td>{joinList(presentList(scene))}</td>
        <td className="whitespace-nowrap col-time">
          {editable ? (
            <span className="time-edit">
              <input
                type="number"
                min="0"
                value={scene.estimatedMinutes ?? 0}
                onChange={(e) => onChangeScene(index, { estimatedMinutes: Number(e.target.value) })}
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
          <td colSpan={5}>
            <div className="schedule-extra">
              <div className="schedule-extra-item schedule-extra-summary">
                <span className="schedule-extra-label">AI 简介</span>
                {editable ? (
                  <textarea
                    value={scene.summary ?? ''}
                    onChange={(e) => onChangeScene(index, { summary: e.target.value })}
                    className="cell-input extra-textarea"
                    rows={2}
                    aria-label="编辑 AI 简介"
                  />
                ) : (
                  <span>{scene.summary || '—'}</span>
                )}
              </div>
              <div className="schedule-extra-item schedule-extra-summary">
                <span className="schedule-extra-label">手工备注</span>
                {editable ? (
                  <textarea
                    value={scene.note ?? ''}
                    onChange={(e) => onChangeScene(index, { note: e.target.value })}
                    className="cell-input extra-textarea"
                    rows={2}
                    placeholder="导演手工补充，可接录音…"
                    aria-label="编辑手工备注"
                  />
                ) : (
                  <span>{scene.note || '—'}</span>
                )}
              </div>
              <div className="schedule-extra-item">
                <span className="schedule-extra-label">在场人物</span>
                <span>{joinList(scene.presentCharacters) || '—'}</span>
              </div>
              <div className="schedule-extra-item">
                <span className="schedule-extra-label">舞台说明</span>
                <span>{joinList(scene.stageDirections) || '—'}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
