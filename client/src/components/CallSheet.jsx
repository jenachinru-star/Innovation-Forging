import { useState } from 'react';
import { Printer, ClipboardList } from 'lucide-react';
import { buildCallSheet } from '@director/shared/rules/coreDesk.js';

export default function CallSheet({ scriptData, plan, dispatch }) {
  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];
  const [sceneNumber, setSceneNumber] = useState(scenes[0]?.sceneNumber ?? 1);
  const overrides = plan?.callSheetNotes?.[sceneNumber] || {};
  const sheet = buildCallSheet(scriptData, sceneNumber, overrides);

  function patchNote(field, value) {
    dispatch({
      type: 'setCallSheetNote',
      sceneNumber,
      note: { ...overrides, [field]: value },
    });
  }

  if (!sheet) {
    return <p className="muted">暂无可生成通告的场次。</p>;
  }

  return (
    <div className="call-sheet" data-testid="call-sheet">
      <label className="cs-scene-select">
        选择场次
        <select value={sceneNumber} onChange={(e) => setSceneNumber(Number(e.target.value))}>
          {scenes.map((s) => (
            <option key={s.id} value={s.sceneNumber}>
              第 {s.sceneNumber} 场 {s.title}
            </option>
          ))}
        </select>
      </label>

      <article className="cs-paper">
        <header className="cs-paper-head">
          <ClipboardList size={18} aria-hidden />
          <div className="cs-paper-title">
            <span className="eyebrow">CALL SHEET</span>
            <h3>{plan?.name || '未命名作品'} · 通告单</h3>
          </div>
          <button type="button" className="btn-ghost" onClick={() => window.print()}>
            <Printer size={14} aria-hidden /> 打印
          </button>
        </header>

        <div className="cs-section">
          <h4>场次信息</h4>
          <p>
            <b>场次：</b>第 {sheet.sceneNumber} 场 {sheet.title}
          </p>
          <p>
            <b>地点：</b>{sheet.location || '未标注'}
          </p>
          <p>
            <b>预计时长：</b>{sheet.estimatedMinutes} 分钟
          </p>
        </div>

        <div className="cs-section">
          <h4>在场人物</h4>
          <div className="cs-tags">
            {sheet.characters.length ? (
              sheet.characters.map((n) => (
                <span key={n} className="cs-tag">
                  {n}
                </span>
              ))
            ) : (
              <span className="muted">无</span>
            )}
          </div>
        </div>

        <div className="cs-section">
          <h4>道具</h4>
          <div className="cs-tags">
            {sheet.props.length ? (
              sheet.props.map((p) => (
                <span key={p} className="cs-tag cs-prop-tag">
                  {p}
                </span>
              ))
            ) : (
              <span className="muted">无</span>
            )}
          </div>
        </div>

        {sheet.stageDirections.length > 0 && (
          <div className="cs-section">
            <h4>舞台说明</h4>
            <ul className="cs-directions">
              {sheet.stageDirections.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="cs-section">
          <h4>集合安排（可编辑）</h4>
          <div className="cs-edit-grid">
            <label>
              集合时间
              <input
                value={overrides.callTime || ''}
                onChange={(e) => patchNote('callTime', e.target.value)}
              />
            </label>
            <label>
              集合地点
              <input
                value={overrides.assembly || ''}
                onChange={(e) => patchNote('assembly', e.target.value)}
              />
            </label>
            <label>
              联系人
              <input
                value={overrides.contact || ''}
                onChange={(e) => patchNote('contact', e.target.value)}
              />
            </label>
            <label className="cs-full">
              备注
              <textarea
                rows={2}
                value={overrides.notes || ''}
                onChange={(e) => patchNote('notes', e.target.value)}
              />
            </label>
          </div>
        </div>
      </article>
    </div>
  );
}
