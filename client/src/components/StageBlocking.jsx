import { useRef, useState } from 'react';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@director/shared/rules/briefs.js';
import { nextId } from '../store/plan.js';

const VIEW_W = 800;
const VIEW_H = 480;
const DEFAULT_Y = Math.round(VIEW_H * 0.62);

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeCharacters(characters) {
  const list = Array.isArray(characters) ? characters : [];
  return list
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return { id: `ch-${item}`, name: item };
      const name = item.name || item.id || '';
      if (!name) return null;
      return { id: item.id || `ch-${name}`, name };
    })
    .filter(Boolean);
}

function getScene(scenes, sceneNumber) {
  const list = Array.isArray(scenes) ? scenes : [];
  if (list.length === 0) return null;
  return list.find((scene) => Number(scene?.sceneNumber) === Number(sceneNumber)) || list[0];
}

function hasScene(scenes, sceneNumber) {
  const list = Array.isArray(scenes) ? scenes : [];
  return list.some((scene) => Number(scene?.sceneNumber) === Number(sceneNumber));
}

function sceneLines(scenes, sceneNumber) {
  const scene = getScene(scenes, sceneNumber);
  const raw = scene?.lines ?? scene?.dialogue ?? scene?.quotes ?? [];
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const lines = [];
  for (const item of list) {
    const speaker = typeof item === 'object' && item ? String(item.speaker ?? '').trim() : '';
    const text = String(
      typeof item === 'string' ? item : (item?.text ?? item?.quote ?? item?.content ?? '')
    ).trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    lines.push({ speaker, text });
  }
  return lines;
}

function actorsFor(characters, cast) {
  const base = normalizeCharacters(characters);
  const castMap = cast && typeof cast === 'object' && !Array.isArray(cast) ? cast : {};
  const actors = [];

  for (const character of base) {
    const players = Array.isArray(castMap[character.name]) ? castMap[character.name] : [];
    if (players.length > 1) {
      players.forEach((player, index) => {
        const suffix = String.fromCharCode(65 + index);
        const characterId = `${character.name}#${suffix}`;
        actors.push({
          characterId,
          label: `${character.name}（${suffix}）`,
        });
      });
    } else {
      actors.push({ characterId: character.name, label: character.name });
    }
  }

  return actors;
}

function defaultPosition(index, total) {
  return {
    x: Math.round((VIEW_W * (index + 1)) / (total + 1)),
    y: DEFAULT_Y,
  };
}

function storedPosition(placements, sceneNumber, characterId) {
  const list = Array.isArray(placements) ? placements : [];
  const found = list.find(
    (item) =>
      item &&
      item.characterId === characterId &&
      Number(item.sceneNumber) === Number(sceneNumber)
  );
  if (found && Number.isFinite(found.x) && Number.isFinite(found.y)) {
    return { x: found.x, y: found.y };
  }
  return null;
}

export default function StageBlocking({
  characters,
  scenes,
  sceneNumber = 1,
  plan,
  dispatch,
}) {
  const svgRef = useRef(null);
  const stage3dRef = useRef(null);
  const dragRef = useRef(null);
  const pathRef = useRef([]);
  const [draggingId, setDraggingId] = useState(null);
  const [positions, setPositions] = useState({});
  const [objectPositions, setObjectPositions] = useState({});
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [objectKind, setObjectKind] = useState('table');
  const [recordPath, setRecordPath] = useState(false);
  const [pathDraft, setPathDraft] = useState([]);
  const [viewMode, setViewMode] = useState('plan');
  const [showForm, setShowForm] = useState(false);
  const [department, setDepartment] = useState(DEPARTMENTS[0] || 'lighting');
  const [content, setContent] = useState('');
  const [quote, setQuote] = useState('');
  const [action, setAction] = useState('');

  const actors = actorsFor(characters, plan?.cast);
  const placements = plan?.staging?.placements;
  const lines = sceneLines(scenes, sceneNumber);
  const noScene = !hasScene(scenes, sceneNumber);
  const sceneCues = (Array.isArray(plan?.cues) ? plan.cues : []).filter(
    (cue) => cue && Number(cue.sceneNumber) === Number(sceneNumber)
  );
  const sceneObjects = (Array.isArray(plan?.staging?.objects) ? plan.staging.objects : []).filter(
    (object) => object && Number(object.sceneNumber) === Number(sceneNumber)
  );
  const scenePaths = (Array.isArray(plan?.staging?.paths) ? plan.staging.paths : []).filter(
    (path) => path && Number(path.sceneNumber) === Number(sceneNumber)
  );
  const sceneDirections = Array.isArray(getScene(scenes, sceneNumber)?.stageDirections)
    ? getScene(scenes, sceneNumber).stageDirections
    : [];

  function positionFor(actor, index) {
    const local = positions[sceneNumber]?.[actor.characterId];
    if (local) return local;
    return storedPosition(placements, sceneNumber, actor.characterId) || defaultPosition(index, actors.length);
  }

  function objectPositionFor(object) {
    const local = objectPositions[sceneNumber]?.[object.id];
    return local || { x: object.x, y: object.y };
  }

  function handlePointerDown(event, actor, position) {
    event.preventDefault?.();
    dragRef.current = {
      kind: 'actor',
      id: actor.characterId,
      characterId: actor.characterId,
      x: position.x,
      y: position.y,
    };
    if (recordPath) {
      pathRef.current = [{ x: position.x, y: position.y }];
      setPathDraft(pathRef.current);
    }
    setDraggingId(actor.characterId);
  }

  function handleObjectPointerDown(event, object, position) {
    event.preventDefault?.();
    setSelectedObjectId(object.id);
    dragRef.current = {
      kind: 'object',
      id: object.id,
      x: position.x,
      y: position.y,
    };
    setDraggingId(object.id);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;

    const box = svg.getBoundingClientRect();
    const width = box.width || VIEW_W;
    const height = box.height || VIEW_H;
    const clientX = Number(event.clientX ?? event.nativeEvent?.clientX ?? 0);
    const clientY = Number(event.clientY ?? event.nativeEvent?.clientY ?? 0);
    const x = clamp((clientX - (box.left || 0)) * (VIEW_W / width), 0, VIEW_W);
    const y = clamp((clientY - (box.top || 0)) * (VIEW_H / height), 0, VIEW_H);

    dragRef.current = { ...dragRef.current, x, y };
    if (dragRef.current.kind === 'actor' && recordPath) {
      pathRef.current = [...pathRef.current, { x, y }];
      setPathDraft(pathRef.current);
    }
    if (dragRef.current.kind === 'object') {
      setObjectPositions((prev) => {
        const forScene = prev[sceneNumber] && typeof prev[sceneNumber] === 'object' ? prev[sceneNumber] : {};
        return {
          ...prev,
          [sceneNumber]: { ...forScene, [dragRef.current.id]: { x, y } },
        };
      });
    } else {
      setPositions((prev) => {
        const forScene = prev[sceneNumber] && typeof prev[sceneNumber] === 'object' ? prev[sceneNumber] : {};
        return {
          ...prev,
          [sceneNumber]: { ...forScene, [dragRef.current.characterId]: { x, y } },
        };
      });
    }
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraggingId(null);

    const x = Number.isFinite(drag.x) ? drag.x : 0;
    const y = Number.isFinite(drag.y) ? drag.y : 0;
    if (drag.kind === 'object') {
      dispatch?.({
        type: 'updateStageObject',
        id: drag.id,
        patch: { x, y },
      });
    } else {
      dispatch?.({
        type: 'setPlacement',
        placement: { sceneNumber, characterId: drag.characterId, x, y },
      });
      if (recordPath && pathRef.current.length > 1) {
        dispatch?.({
          type: 'addPath',
          path: {
            sceneNumber,
            characterId: drag.characterId,
            points: pathRef.current,
            triggerQuote: '',
          },
        });
      }
    }
    pathRef.current = [];
    setPathDraft([]);
  }

  function handle3DPointerMove(event) {
    if (!dragRef.current) return;
    const box = stage3dRef.current?.getBoundingClientRect();
    if (!box) return;
    const clientX = Number(event.clientX ?? event.nativeEvent?.clientX ?? 0);
    const clientY = Number(event.clientY ?? event.nativeEvent?.clientY ?? 0);
    const x = clamp(((clientX - box.left) / (box.width || 1)) * VIEW_W, 0, VIEW_W);
    const y = clamp(((clientY - box.top) / (box.height || 1)) * VIEW_H, 0, VIEW_H);
    dragRef.current = { ...dragRef.current, x, y };
    if (dragRef.current.kind === 'actor' && recordPath) {
      pathRef.current = [...pathRef.current, { x, y }];
      setPathDraft(pathRef.current);
    }
    if (dragRef.current.kind === 'object') {
      setObjectPositions((prev) => {
        const forScene = prev[sceneNumber] && typeof prev[sceneNumber] === 'object' ? prev[sceneNumber] : {};
        return {
          ...prev,
          [sceneNumber]: { ...forScene, [dragRef.current.id]: { x, y } },
        };
      });
    } else {
      setPositions((prev) => {
        const forScene = prev[sceneNumber] && typeof prev[sceneNumber] === 'object' ? prev[sceneNumber] : {};
        return {
          ...prev,
          [sceneNumber]: { ...forScene, [dragRef.current.characterId]: { x, y } },
        };
      });
    }
  }

  function handleAddObject() {
    const labels = { table: '桌', chair: '椅', entrance: '门口', prop: '道具' };
    dispatch?.({
      type: 'addStageObject',
      object: {
        id: nextId('object', plan?.staging?.objects),
        kind: objectKind,
        label: labels[objectKind] || '道具',
        sceneNumber,
        x: VIEW_W / 2,
        y: VIEW_H / 2,
        rotation: 0,
        scale: 1,
      },
    });
  }

  function handleAddCue() {
    const text = content.trim();
    if (!text) return;

    const quoteText = quote.trim();
    const actionText = action.trim();
    const cue = {
      id: nextId('cue', plan?.cues),
      department,
      sceneNumber,
      trigger: quoteText
        ? { type: 'line', quote: quoteText }
        : actionText
          ? { type: 'action', quote: actionText }
          : { type: 'free', quote: '' },
      content: text,
      status: 'draft',
      note: '',
      anchor: {
        kind: quoteText ? 'line' : actionText ? 'action' : 'scene',
        sceneId: `sc-${sceneNumber}`,
        quote: quoteText || actionText,
      },
    };
    dispatch?.({ type: 'addCue', cue });

    setContent('');
    setQuote('');
    setAction('');
    setShowForm(false);
  }

  return (
    <div>
      <div className="stage-view-switch" role="group" aria-label="舞台视图">
        <button
          type="button"
          className={viewMode === 'plan' ? 'is-active' : ''}
          onClick={() => setViewMode('plan')}
        >
          2D 平面
        </button>
        <button
          type="button"
          className={viewMode === '3d' ? 'is-active' : ''}
          onClick={() => setViewMode('3d')}
        >
          3D 白模
        </button>
        <button
          type="button"
          className={recordPath ? 'is-active' : ''}
          aria-pressed={recordPath}
          onClick={() => setRecordPath((value) => !value)}
        >
          记录走位轨迹
        </button>
        <span>两种视图共享同一组位置数据</span>
      </div>

      <div className="stage-object-tools">
        <label htmlFor="stage-object-kind">添加白模对象</label>
        <select
          id="stage-object-kind"
          className="field"
          value={objectKind}
          onChange={(event) => setObjectKind(event.target.value)}
        >
          <option value="table">桌</option>
          <option value="chair">椅子</option>
          <option value="entrance">出入口</option>
          <option value="prop">通用道具</option>
        </select>
        <button type="button" className="btn-ghost btn-small" onClick={handleAddObject}>
          放入舞台
        </button>
        {selectedObjectId && (
          <div className="stage-object-inspector">
            {(() => {
              const selectedObject = sceneObjects.find((item) => item.id === selectedObjectId);
              if (!selectedObject) return null;
              return (
                <>
                  <label>
                    旋转
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      value={selectedObject.rotation || 0}
                      onChange={(event) =>
                        dispatch?.({
                          type: 'updateStageObject',
                          id: selectedObject.id,
                          patch: { rotation: Number(event.target.value) || 0 },
                        })
                      }
                    />
                  </label>
                  <label>
                    大小
                    <input
                      type="number"
                      min="0.4"
                      max="2.5"
                      step="0.1"
                      value={selectedObject.scale || 1}
                      onChange={(event) =>
                        dispatch?.({
                          type: 'updateStageObject',
                          id: selectedObject.id,
                          patch: { scale: Number(event.target.value) || 1 },
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="text-action is-danger"
                    onClick={() => {
                      dispatch?.({ type: 'removeStageObject', id: selectedObject.id });
                      setSelectedObjectId('');
                    }}
                  >
                    移除
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="media-area overflow-hidden rounded-lg">
        {viewMode === 'plan' ? (
          <svg
            ref={svgRef}
            data-testid="stage-canvas"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block h-auto w-full touch-none select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
          <rect
            x="0"
            y="0"
            width={VIEW_W}
            height={VIEW_H}
            style={{ fill: 'var(--media-bg)' }}
          />

          <text
            x={VIEW_W / 2}
            y="24"
            textAnchor="middle"
            fontSize="15"
            style={{ fill: 'var(--media-muted)' }}
          >
            观众方向
          </text>

          <rect
            x="60"
            y="44"
            width="680"
            height="400"
            rx="10"
            strokeWidth="2"
            style={{ fill: 'var(--media-raised)', stroke: 'var(--media-muted)' }}
          />

          {scenePaths.map((path) =>
            Array.isArray(path.points) && path.points.length > 1 ? (
              <polyline
                key={path.id}
                points={path.points.map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke="#b39b73"
                strokeWidth="2"
                strokeDasharray="6 6"
                opacity=".75"
              />
            ) : null
          )}
          {pathDraft.length > 1 && (
            <polyline
              points={pathDraft.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke="var(--cue)"
              strokeWidth="3"
              strokeDasharray="5 5"
            />
          )}

          {sceneObjects.map((object) => {
            const position = objectPositionFor(object);
            const width = 54 * (object.scale || 1) * (object.kind === 'table' ? 1.5 : 1);
            const height = 30 * (object.scale || 1);
            return (
              <g
                key={object.id}
                data-testid={`stage-object-${object.id}`}
                onPointerDown={(event) => handleObjectPointerDown(event, object, position)}
                style={{ cursor: 'grab' }}
              >
                <rect
                  x={position.x - width / 2}
                  y={position.y - height / 2}
                  width={width}
                  height={height}
                  rx="3"
                  transform={`rotate(${object.rotation || 0} ${position.x} ${position.y})`}
                  fill="#3a3026"
                  stroke={selectedObjectId === object.id ? 'var(--cue)' : '#756047'}
                  strokeWidth="2"
                />
                <text
                  x={position.x}
                  y={position.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#d8c9b1"
                >
                  {object.label || object.kind}
                </text>
              </g>
            );
          })}

          <rect
            x="18"
            y="200"
            width="34"
            height="88"
            rx="4"
            style={{ fill: 'var(--media-raised)', stroke: 'var(--media-muted)' }}
          />
          <text
            x="35"
            y="250"
            textAnchor="middle"
            fontSize="12"
            style={{ fill: 'var(--media-ink)' }}
          >
            上场口
          </text>

          <rect
            x="748"
            y="200"
            width="34"
            height="88"
            rx="4"
            style={{ fill: 'var(--media-raised)', stroke: 'var(--media-muted)' }}
          />
          <text
            x="765"
            y="250"
            textAnchor="middle"
            fontSize="12"
            style={{ fill: 'var(--media-ink)' }}
          >
            下场口
          </text>

          {actors.map((actor, index) => {
            const position = positionFor(actor, index);
            const dragging = draggingId === actor.characterId;
            return (
              <g
                key={actor.characterId}
                data-testid={`actor-${actor.characterId}`}
                data-x={position.x}
                data-y={position.y}
                onPointerDown={(event) => handlePointerDown(event, actor, position)}
                style={{ cursor: dragging ? 'grabbing' : 'grab' }}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="26"
                  strokeWidth="2"
                  style={{
                    fill: dragging ? 'var(--paper-raised)' : 'var(--media-ink)',
                    stroke: dragging ? 'var(--accent-seal)' : 'var(--ink-muted)',
                  }}
                />
                <text
                  x={position.x}
                  y={position.y + 5}
                  textAnchor="middle"
                  fontSize="13"
                  style={{ fill: 'var(--ink)' }}
                >
                  {actor.label}
                </text>
              </g>
            );
          })}
          </svg>
        ) : (
          <div
            ref={stage3dRef}
            className="stage-3d-viewport"
            onPointerMove={handle3DPointerMove}
            onPointerUp={handlePointerUp}
            aria-label="三维白模预览"
          >
            <span className="stage-3d-audience">观众方向</span>
            <div className="stage-3d-floor">
              <span className="stage-3d-door is-left">上场口</span>
              <span className="stage-3d-door is-right">下场口</span>
              {sceneObjects.map((object) => {
                const position = objectPositionFor(object);
                return (
                  <button
                    type="button"
                    key={object.id}
                    className={`stage-3d-object ${selectedObjectId === object.id ? 'is-selected' : ''}`}
                    style={{
                      left: `${(position.x / VIEW_W) * 100}%`,
                      top: `${(position.y / VIEW_H) * 100}%`,
                      transform: `translate(-50%, -50%) translateZ(8px) rotate(${object.rotation || 0}deg) scale(${object.scale || 1})`,
                    }}
                    onPointerDown={(event) => handleObjectPointerDown(event, object, position)}
                  >
                    {object.label || object.kind}
                  </button>
                );
              })}
              {actors.map((actor, index) => {
                const position = positionFor(actor, index);
                return (
                  <button
                    type="button"
                    key={actor.characterId}
                    data-testid={`actor-3d-${actor.characterId}`}
                    className="stage-3d-actor"
                    style={{
                      left: `${(position.x / VIEW_W) * 100}%`,
                      top: `${(position.y / VIEW_H) * 100}%`,
                    }}
                    onPointerDown={(event) => handlePointerDown(event, actor, position)}
                  >
                    <span>{actor.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="stage-3d-caption">拖动演员调整平面位置 · 白模为排演预览，不模拟真实灯具</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">技术提示</h4>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="btn-seal px-3 py-1 text-xs"
          >
            添加提示
          </button>
        </div>

        {showForm && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="cue-department" className="muted mb-1 block text-xs">
                部门
              </label>
              <select
                id="cue-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="field px-2 py-1 text-sm"
              >
                {DEPARTMENTS.map((value) => (
                  <option key={value} value={value}>
                    {DEPARTMENT_LABELS[value] || value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cue-content" className="muted mb-1 block text-xs">
                内容
              </label>
              <input
                id="cue-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="例如：加定点"
                className="field px-2 py-1 text-sm"
              />
            </div>

            <div>
              <label htmlFor="cue-quote" className="muted mb-1 block text-xs">
                绑定台词
              </label>
              <select
                id="cue-quote"
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                className="field px-2 py-1 text-sm"
              >
                <option value="">不绑定</option>
                {lines.map((line) => (
                  <option key={line.text} value={line.text}>
                    {line.speaker ? `${line.speaker}：${line.text}` : line.text}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cue-action" className="muted mb-1 block text-xs">
                绑定动作
              </label>
              <select
                id="cue-action"
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  if (event.target.value) setQuote('');
                }}
                className="field px-2 py-1 text-sm"
              >
                <option value="">不绑定动作</option>
                {sceneDirections.map((direction, index) => (
                  <option key={`${direction}-${index}`} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddCue}
              className="btn-seal px-3 py-1.5 text-sm"
            >
              确认添加
            </button>
          </div>
        )}

        {sceneCues.length === 0 ? (
          <p className="muted mt-3 text-xs">
            {noScene ? '当前场次无提示' : '本场暂无提示。'}
          </p>
        ) : (
          <ul
            className="zebra mt-3 overflow-hidden rounded-md border"
            style={{ borderColor: 'var(--line)' }}
          >
            {sceneCues.map((cue) => (
              <li
                key={cue.id}
                data-testid={`cue-${cue.id}`}
                className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="tag px-2 py-0.5">
                  {DEPARTMENT_LABELS[cue.department] || cue.department}
                </span>
                <span className="flex-1">{cue.content}</span>
                {cue.trigger?.quote && (
                  <span className="muted">
                    绑定{cue.trigger.type === 'action' ? '动作' : '台词'}：{cue.trigger.quote}
                  </span>
                )}
                <select
                  aria-label={`提示状态 ${cue.content}`}
                  value={cue.status || 'draft'}
                  onChange={(event) =>
                    dispatch?.({
                      type: 'updateCue',
                      id: cue.id,
                      patch: { status: event.target.value },
                    })
                  }
                  className="cue-status-select"
                >
                  <option value="draft">草案</option>
                  <option value="review">待复核</option>
                  <option value="confirmed">已确认</option>
                </select>
                <button
                  type="button"
                  onClick={() => dispatch?.({ type: 'removeCue', id: cue.id })}
                  className="muted underline"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
