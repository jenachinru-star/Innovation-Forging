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
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [positions, setPositions] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [department, setDepartment] = useState(DEPARTMENTS[0] || 'lighting');
  const [content, setContent] = useState('');
  const [quote, setQuote] = useState('');

  const actors = actorsFor(characters, plan?.cast);
  const placements = plan?.staging?.placements;
  const lines = sceneLines(scenes, sceneNumber);
  const currentScene = getScene(scenes, sceneNumber);
  const sceneCues = (Array.isArray(plan?.cues) ? plan.cues : []).filter((cue) => {
    if (!cue) return false;
    if (cue.sceneNumber != null) {
      return Number(cue.sceneNumber) === Number(sceneNumber);
    }
    return Boolean(currentScene?.id) && cue.sceneId === currentScene.id;
  });

  function positionFor(actor, index) {
    const local = positions[actor.characterId];
    if (local) return local;
    return storedPosition(placements, sceneNumber, actor.characterId) || defaultPosition(index, actors.length);
  }

  function handlePointerDown(event, actor, position) {
    event.preventDefault?.();
    dragRef.current = { characterId: actor.characterId, x: position.x, y: position.y };
    setDraggingId(actor.characterId);
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
    setPositions((prev) => ({ ...prev, [dragRef.current.characterId]: { x, y } }));
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraggingId(null);

    const x = Number.isFinite(drag.x) ? drag.x : 0;
    const y = Number.isFinite(drag.y) ? drag.y : 0;
    dispatch?.({
      type: 'setPlacement',
      placement: { sceneNumber, characterId: drag.characterId, x, y },
    });
  }

  function handleAddCue() {
    const text = content.trim();
    if (!text) return;

    const cue = {
      id: nextId('cue', plan?.cues),
      department,
      sceneNumber,
      trigger: { type: 'line', quote },
      content: text,
      status: 'draft',
      note: '',
    };
    dispatch?.({ type: 'addCue', cue });

    setContent('');
    setQuote('');
    setShowForm(false);
  }

  return (
    <div>
      <div className="media-area overflow-hidden rounded-lg">
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
          <p className="muted mt-3 text-xs">本场暂无提示。</p>
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
                  <span className="muted">绑定：{cue.trigger.quote}</span>
                )}
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
