import { useState } from 'react';
import { Plus, Trash2, Swords } from 'lucide-react';
import { CONFLICT_TYPES, CONFLICT_STATUS } from '@director/shared/rules/coreDesk.js';

export default function ConflictBoard({ scriptData, plan, dispatch }) {
  const conflicts = Array.isArray(plan?.conflicts) ? plan.conflicts : [];
  const characters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const visible = conflicts.filter(
    (c) =>
      (typeFilter === 'all' || c.type === typeFilter) &&
      (statusFilter === 'all' || c.status === statusFilter)
  );

  function addConflict() {
    dispatch({
      type: 'addConflict',
      conflict: {
        type: 'interpersonal',
        parties: [],
        sceneId: '',
        sceneNumber: null,
        title: '新冲突',
        description: '',
        intensity: 3,
        status: 'open',
      },
    });
  }

  function patch(c, patchObj) {
    dispatch({ type: 'updateConflict', id: c.id, patch: patchObj });
  }

  return (
    <div className="conflict-board" data-testid="conflict-board">
      <div className="cb-filters">
        <div className="cb-filter-group">
          <button
            type="button"
            className={typeFilter === 'all' ? 'is-active' : ''}
            onClick={() => setTypeFilter('all')}
          >
            全部类型
          </button>
          {CONFLICT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={typeFilter === t.id ? 'is-active' : ''}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="cb-filter-group">
          <button
            type="button"
            className={statusFilter === 'all' ? 'is-active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            全部状态
          </button>
          {CONFLICT_STATUS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={statusFilter === s.id ? 'is-active' : ''}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-seal cb-add" onClick={addConflict}>
          <Plus size={14} aria-hidden /> 添加冲突
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="muted cb-empty">暂无冲突记录，点击「添加冲突」开始梳理。</p>
      ) : (
        <div className="cb-grid">
          {visible.map((c) => (
            <article key={c.id} className="cb-card" data-testid={`conflict-${c.id}`}>
              <div className="cb-card-head">
                <Swords size={15} aria-hidden />
                <input
                  className="cb-title-input"
                  value={c.title}
                  onChange={(e) => patch(c, { title: e.target.value })}
                  aria-label="冲突标题"
                />
                <button
                  type="button"
                  className="cb-delete"
                  onClick={() => dispatch({ type: 'removeConflict', id: c.id })}
                  aria-label="删除冲突"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
              <div className="cb-row">
                <label>
                  类型
                  <select value={c.type} onChange={(e) => patch(c, { type: e.target.value })}>
                    {CONFLICT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  状态
                  <select value={c.status} onChange={(e) => patch(c, { status: e.target.value })}>
                    {CONFLICT_STATUS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="cb-block">
                相关角色
                <select
                  value={c.parties[0] || ''}
                  onChange={(e) => patch(c, { parties: e.target.value ? [e.target.value] : [] })}
                >
                  <option value="">未指定</option>
                  {characters.map((ch) => (
                    <option key={ch.id} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cb-block cb-intensity-row">
                强度
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={c.intensity}
                  onChange={(e) => patch(c, { intensity: Number(e.target.value) })}
                />
                <span>{c.intensity}/5</span>
              </label>
              <label className="cb-block">
                描述
                <textarea
                  rows={2}
                  value={c.description}
                  onChange={(e) => patch(c, { description: e.target.value })}
                />
              </label>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
