import { useMemo, useState } from 'react';
import { splitBrief, DEPARTMENTS, DEPARTMENT_LABELS } from '@director/shared/rules/briefs.js';

const STATUS_OPTIONS = [
  ['draft', '草稿'],
  ['submitted', '已提交'],
  ['confirmed', '已确认'],
  ['implemented', '已实施'],
  ['needsReview', '待确认'],
];

const GROUP_ORDER = [...DEPARTMENTS, 'uncertain'];
const GROUP_LABELS = { ...DEPARTMENT_LABELS, uncertain: '待确认' };

function sceneLabel(scene) {
  if (!scene) return '未命名场次';
  const title = scene.title || scene.location || '未命名';
  return `第 ${scene.sceneNumber} 场 · ${title}`;
}

export default function BriefPanel({ scenes = [], plan, dispatch }) {
  const list = Array.isArray(scenes) ? scenes : [];
  const briefs = Array.isArray(plan?.briefs) ? plan.briefs : [];
  const cues = Array.isArray(plan?.cues) ? plan.cues : [];
  const [sceneId, setSceneId] = useState(list[0]?.id || '');
  const [original, setOriginal] = useState('');
  const [lastOriginal, setLastOriginal] = useState('');

  const grouped = useMemo(() => {
    const map = new Map();
    for (const brief of briefs) {
      if (!brief) continue;
      const key = GROUP_LABELS[brief.department] ? brief.department : 'uncertain';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(brief);
    }
    return GROUP_ORDER.filter((key) => map.has(key)).map((key) => [key, map.get(key)]);
  }, [briefs]);

  function handleSplit() {
    const text = original.trim();
    if (!text) return;
    const scene = list.find((item) => (item.id || '') === sceneId) || list[0];
    const parts = splitBrief(text, {
      sceneId,
      sceneNumber: scene?.sceneNumber ?? null,
    });
    for (const brief of parts) {
      dispatch?.({ type: 'addBrief', brief });
    }
    setLastOriginal(text);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <label htmlFor="brief-scene" className="muted mb-1 block text-xs">
            场次
          </label>
          <select
            id="brief-scene"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
            className="field px-2 py-1 text-sm"
          >
            {list.length === 0 && <option value="">暂无场次</option>}
            {list.map((scene) => (
              <option key={scene.id || scene.sceneNumber} value={scene.id || ''}>
                {sceneLabel(scene)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[16rem] flex-1">
          <label htmlFor="brief-original" className="muted mb-1 block text-xs">
            导演原话
          </label>
          <textarea
            id="brief-original"
            rows={3}
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="例如：这里想更暖一点，加个定点；音乐渐入"
            className="field w-full px-2 py-1 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleSplit}
          className="btn-seal mt-5 px-3 py-1.5 text-sm"
        >
          拆分
        </button>
      </div>

      {lastOriginal && (
        <p className="muted mt-2 text-xs">原话：{lastOriginal}</p>
      )}

      {grouped.length === 0 ? (
        <p className="muted mt-4 text-sm">暂无需求条目，先输入导演原话并拆分。</p>
      ) : (
        <div className="mt-4 space-y-5">
          {grouped.map(([department, items]) => (
            <section key={department} data-testid={`brief-group-${department}`}>
              <h4 className="mb-2 text-sm font-medium">
                {GROUP_LABELS[department] || department}
              </h4>
              <ul
                className="zebra overflow-hidden rounded-md border"
                style={{ borderColor: 'var(--line)' }}
              >
                {items.map((brief) => {
                  const statusId = `brief-status-${brief.id}`;
                  const dueId = `brief-due-${brief.id}`;
                  const cueId = `brief-cue-${brief.id}`;
                  const done = brief.status === 'confirmed' || brief.status === 'implemented';
                  const sceneCues = cues.filter(
                    (cue) => cue && Number(cue.sceneNumber) === Number(brief.sceneNumber)
                  );
                  return (
                    <li
                      key={brief.id}
                      className="border-b px-3 py-2"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <p className="flex items-start gap-2 text-sm">
                        <span
                          className={`state-dot mt-1.5 ${done ? 'state-done' : 'state-open'}`}
                        />
                        <span>{brief.original}</span>
                      </p>
                      {Array.isArray(brief.items) && brief.items.length > 0 && (
                        <p className="muted mt-1 text-xs">条目：{brief.items.join('；')}</p>
                      )}
                      {Array.isArray(brief.uncertain) && brief.uncertain.length > 0 && (
                        <p className="state-open mt-1 text-xs">待确认：{brief.uncertain.join('；')}</p>
                      )}
                      <div className="muted mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <label htmlFor={statusId}>状态</label>
                        <select
                          id={statusId}
                          value={brief.status || 'draft'}
                          onChange={(e) =>
                            dispatch?.({
                              type: 'updateBrief',
                              id: brief.id,
                              patch: { status: e.target.value },
                            })
                          }
                          className="field px-1 py-0.5 text-xs"
                        >
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>

                        <label htmlFor={dueId}>截止</label>
                        <input
                          id={dueId}
                          type="date"
                          value={brief.dueDate || ''}
                          onChange={(e) =>
                            dispatch?.({
                              type: 'updateBrief',
                              id: brief.id,
                              patch: { dueDate: e.target.value || null },
                            })
                          }
                          className="field px-1 py-0.5 text-xs"
                        />
                      </div>
                      <div className="muted mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <label htmlFor={cueId}>关联提示</label>
                        <select
                          id={cueId}
                          value={brief.cueId || ''}
                          onChange={(e) =>
                            dispatch?.({
                              type: 'updateBrief',
                              id: brief.id,
                              patch: { cueId: e.target.value || null },
                            })
                          }
                          className="field px-1 py-0.5 text-xs"
                        >
                          <option value="">不关联</option>
                          {sceneCues.map((cue) => (
                            <option key={cue.id} value={cue.id}>
                              [{DEPARTMENT_LABELS[cue.department] || cue.department}] {cue.content}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
