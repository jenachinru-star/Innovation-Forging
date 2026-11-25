import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Grid3x3,
  Box,
  List as ListIcon,
  Pencil,
  Lock,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Music,
  Volume2,
  Package,
  Route,
  Clapperboard,
} from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_LABELS } from '@director/shared/rules/briefs.js';
import { nextId } from '../store/plan.js';
import { CHARACTER_IMAGE } from '../assets/samples/index.js';

const VIEW_W = 800;
const VIEW_H = 480;
const DEFAULT_Y = Math.round(VIEW_H * 0.62);
const DURATION = 330; // 时间轴总时长（秒），对齐设计稿 05:30

// 舞台子 Tab：舞台 / 调度 / 灯光 / 音乐 / 道具 / 音效
const STAGE_TABS = [
  { id: 'stage', label: '舞台', icon: Clapperboard },
  { id: 'block', label: '调度', icon: Route },
  { id: 'light', label: '灯光', icon: Lightbulb },
  { id: 'music', label: '音乐', icon: Music },
  { id: 'prop', label: '道具', icon: Package },
  { id: 'sound', label: '音效', icon: Volume2 },
];

// 底部舞台调度卡片：动作 / 走位 / 提示
const DISPATCH_TABS = [
  { id: 'action', label: '动作' },
  { id: 'block', label: '走位' },
  { id: 'cue', label: '提示' },
];

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

// 秒 → hh:mm:ss
function formatTime(sec) {
  const total = clamp(sec, 0, DURATION);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

// 沿点序列按进度（0~1）取点，线性段插值
function pointAtProgress(points, progress) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const p = clamp(progress, 0, 1);
  const seg = p * (points.length - 1);
  const index = Math.min(Math.floor(seg), points.length - 2);
  const k = seg - index;
  return {
    x: points[index].x + (points[index + 1].x - points[index].x) * k,
    y: points[index].y + (points[index + 1].y - points[index].y) * k,
  };
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
        actors.push({ characterId, label: `${character.name}（${suffix}）` });
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
  readOnly = false,
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
  const [stageTab, setStageTab] = useState('stage');
  const [dispatchTab, setDispatchTab] = useState('cue');
  const [locked, setLocked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [department, setDepartment] = useState(DEPARTMENTS[0] || 'lighting');
  const [content, setContent] = useState('');
  const [quote, setQuote] = useState('');
  const [action, setAction] = useState('');

  // —— 时间轴状态（GSAP 驱动）——
  const clockRef = useRef({ t: 0 });
  const tweenRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const actors = actorsFor(characters, plan?.cast);
  const placements = plan?.staging?.placements;
  const lines = sceneLines(scenes, sceneNumber);
  const noScene = !hasScene(scenes, sceneNumber);
  const currentScene = getScene(scenes, sceneNumber);
  const sceneCues = (Array.isArray(plan?.cues) ? plan.cues : []).filter(
    (cue) => cue && Number(cue.sceneNumber) === Number(sceneNumber)
  );
  const sceneObjects = (Array.isArray(plan?.staging?.objects) ? plan.staging.objects : []).filter(
    (object) => object && Number(object.sceneNumber) === Number(sceneNumber)
  );
  const scenePaths = (Array.isArray(plan?.staging?.paths) ? plan.staging.paths : []).filter(
    (path) => path && Number(path.sceneNumber) === Number(sceneNumber)
  );
  const sceneDirections = Array.isArray(currentScene?.stageDirections)
    ? currentScene.stageDirections
    : [];

  const cuesWithTime = useMemo(
    () =>
      sceneCues.map((cue, i) => ({
        ...cue,
        timecode: Number.isFinite(cue.timecode) ? cue.timecode : (i + 1) * 45,
      })),
    [sceneCues]
  );

  // 子 Tab 联动：灯光/音乐/音效过滤右侧 Cue
  const filteredCues = useMemo(() => {
    if (stageTab === 'light') return cuesWithTime.filter((c) => c.department === 'lighting');
    if (stageTab === 'music') return cuesWithTime.filter((c) => c.department === 'music');
    if (stageTab === 'sound') return cuesWithTime.filter((c) => c.department === 'sound');
    return cuesWithTime;
  }, [stageTab, cuesWithTime]);

  // 底部舞台调度卡片数据
  const dispatchItems = useMemo(() => {
    if (dispatchTab === 'action') {
      return sceneDirections.map((d, i) => ({ id: `action-${i}`, desc: d, time: i * 40 }));
    }
    if (dispatchTab === 'block') {
      return scenePaths.map((p, i) => ({
        id: p.id,
        desc: `${p.characterId} 走位（${p.points.length} 个点位）`,
        time: i * 20,
      }));
    }
    return cuesWithTime.map((c) => ({ id: c.id, desc: c.content, time: c.timecode }));
  }, [dispatchTab, sceneDirections, scenePaths, cuesWithTime]);

  // 初始化 GSAP 时间引擎：paused tween 驱动 clock.t
  useEffect(() => {
    const tween = gsap.to(clockRef.current, {
      t: DURATION,
      duration: DURATION,
      ease: 'none',
      paused: true,
      onUpdate: () => setCurrentTime(clockRef.current.t),
      onComplete: () => setIsPlaying(false),
    });
    tweenRef.current = tween;
    return () => tween.kill();
  }, []);

  function togglePlay() {
    const tween = tweenRef.current;
    if (!tween) return;
    if (tween.progress() >= 1) seekTo(0);
    if (isPlaying) {
      tween.pause();
      setIsPlaying(false);
    } else {
      tween.play();
      setIsPlaying(true);
    }
  }

  function seekTo(time) {
    const t = clamp(time, 0, DURATION);
    clockRef.current.t = t;
    tweenRef.current?.seek(t);
    setCurrentTime(t);
  }

  function positionFor(actor, index) {
    const local = positions[sceneNumber]?.[actor.characterId];
    if (local) return local;
    return storedPosition(placements, sceneNumber, actor.characterId) || defaultPosition(index, actors.length);
  }

  // 播放/已 seek 时沿路径插值，否则用静态（含拖拽）位置
  function renderPosition(actor, index) {
    const path = scenePaths.find((item) => item.characterId === actor.characterId);
    if (path && (isPlaying || currentTime > 0)) {
      const animated = pointAtProgress(path.points, currentTime / DURATION);
      if (animated) return animated;
    }
    return positionFor(actor, index);
  }

  function objectPositionFor(object) {
    const local = objectPositions[sceneNumber]?.[object.id];
    return local || { x: object.x, y: object.y };
  }

  function handlePointerDown(event, actor, position) {
    if (locked || readOnly) return;
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
    if (locked || readOnly) return;
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

  function applyDrag(clientX, clientY, box) {
    const width = box.width || VIEW_W;
    const height = box.height || VIEW_H;
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

  function handlePointerMove(event) {
    if (!dragRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    applyDrag(
      Number(event.clientX ?? event.nativeEvent?.clientX ?? 0),
      Number(event.clientY ?? event.nativeEvent?.clientY ?? 0),
      svg.getBoundingClientRect()
    );
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraggingId(null);

    const x = Number.isFinite(drag.x) ? drag.x : 0;
    const y = Number.isFinite(drag.y) ? drag.y : 0;
    if (drag.kind === 'object') {
      dispatch?.({ type: 'updateStageObject', id: drag.id, patch: { x, y } });
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
    applyDrag(
      Number(event.clientX ?? event.nativeEvent?.clientX ?? 0),
      Number(event.clientY ?? event.nativeEvent?.clientY ?? 0),
      box
    );
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

  const isWire = viewMode === 'wire';
  const viewButtons = [
    { id: 'plan', label: '2D' },
    { id: '3d', label: '3D' },
    { id: 'wire', label: '白模' },
  ];
  const toolButtons = [
    { icon: Grid3x3, label: '网格', onClick: () => setStageTab('stage'), disabled: false },
    { icon: Box, label: '对象', onClick: () => setStageTab('prop'), disabled: false },
    { icon: ListIcon, label: '列表', onClick: () => setShowForm((v) => !v), disabled: false },
    { icon: Pencil, label: '编辑', onClick: () => setShowForm((v) => !v), disabled: false },
    {
      icon: Lock,
      label: '锁定',
      onClick: () => setLocked((v) => !v),
      active: locked,
      disabled: readOnly,
    },
  ];

  return (
    <div className="blocking-page">
      <div className="stage-view-switch" role="group" aria-label="舞台视图">
        <div className="view-switch-group">
          {viewButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={viewMode === item.id ? 'is-active' : ''}
              onClick={() => setViewMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={recordPath ? 'is-active' : ''}
          aria-pressed={recordPath}
          disabled={readOnly}
          onClick={() => setRecordPath((value) => !value)}
        >
          记录走位轨迹
        </button>
        <span>三种视图共享同一组位置数据</span>
      </div>

      <div className="blocking-layout">
        <aside className="blocking-notes panel-card">
          <h3 className="blocking-aside-title">场景备注</h3>
          {currentScene?.summary ? (
            <p className="text-sm">{currentScene.summary}</p>
          ) : (
            <p className="muted text-sm">
              {currentScene?.location ? `地点：${currentScene.location}` : '本场暂无备注。'}
            </p>
          )}
          {sceneDirections.length > 0 && (
            <ul className="blocking-note-list">
              {sceneDirections.map((d, i) => (
                <li key={`${d}-${i}`} className="text-xs">{d}</li>
              ))}
            </ul>
          )}
        </aside>

        <section className="blocking-stage">
          <div className="stage-card">
            <div className="stage-card-head">
              <div className="stage-tabs" role="tablist" aria-label="舞台子模块">
                {STAGE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={stageTab === tab.id}
                      className={'stage-tab' + (stageTab === tab.id ? ' is-active' : '')}
                      onClick={() => setStageTab(tab.id)}
                    >
                      <Icon size={14} strokeWidth={1.8} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="stage-tools" role="group" aria-label="舞台工具">
                {toolButtons.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.label}
                      type="button"
                      className={'stage-tool' + (tool.active ? ' is-active' : '')}
                      aria-label={tool.label}
                      aria-pressed={!!tool.active}
                      disabled={tool.disabled}
                      onClick={tool.onClick}
                    >
                      <Icon size={16} strokeWidth={1.7} />
                    </button>
                  );
                })}
              </div>
            </div>

            {stageTab === 'prop' && (
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
                <button
                  type="button"
                  className="btn-ghost btn-small"
                  disabled={readOnly}
                  onClick={handleAddObject}
                >
                  放入舞台
                </button>
                {selectedObjectId && (
                  <span className="muted text-xs">选中对象后可在画布拖动调整</span>
                )}
              </div>
            )}

            <div className="media-area overflow-hidden rounded-lg">
              {viewMode === '3d' ? (
                <div
                  ref={stage3dRef}
                  className="stage-3d-viewport"
                  onPointerMove={handle3DPointerMove}
                  onPointerUp={handlePointerUp}
                  aria-label="三维白模预览"
                >
                  {/* 灯光氛围：顶部聚光灯 */}
                  <div className="stage-light is-left" aria-hidden>
                    <span className="stage-light-beam" />
                    <span className="stage-light-head" />
                  </div>
                  <div className="stage-light is-right" aria-hidden>
                    <span className="stage-light-beam" />
                    <span className="stage-light-head" />
                  </div>
                  <div className="stage-footlight is-left" aria-hidden />
                  <div className="stage-footlight is-right" aria-hidden />
                  <div className="stage-light-wash" aria-hidden />

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
                      const position = renderPosition(actor, index);
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
                  <p className="stage-3d-caption">灯光为氛围预览 · 拖动演员调整平面位置</p>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  data-testid="stage-canvas"
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className={`block h-auto w-full touch-none select-none ${isWire ? 'is-wire' : ''}`}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <rect x="0" y="0" width={VIEW_W} height={VIEW_H} className="stage-bg" />

                  <text
                    x={VIEW_W / 2}
                    y="24"
                    textAnchor="middle"
                    fontSize="15"
                    className="stage-muted-text"
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
                    className="stage-frame"
                  />

                  {scenePaths.map((path) =>
                    Array.isArray(path.points) && path.points.length > 1 ? (
                      <polyline
                        key={path.id}
                        points={path.points.map((point) => `${point.x},${point.y}`).join(' ')}
                        fill="none"
                        className={`stage-path-line ${stageTab === 'block' ? 'is-focus' : ''}`}
                        strokeWidth="2"
                        strokeDasharray="6 6"
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
                          className="stage-object-shape"
                          stroke={selectedObjectId === object.id ? 'var(--cue)' : undefined}
                          strokeWidth="2"
                        />
                        <text
                          x={position.x}
                          y={position.y + 4}
                          textAnchor="middle"
                          fontSize="11"
                          className="stage-object-label"
                        >
                          {object.label || object.kind}
                        </text>
                      </g>
                    );
                  })}

                  <rect x="18" y="200" width="34" height="88" rx="4" className="stage-door" />
                  <text x="35" y="250" textAnchor="middle" fontSize="12" className="stage-ink-text">
                    上场口
                  </text>

                  <rect x="748" y="200" width="34" height="88" rx="4" className="stage-door" />
                  <text x="765" y="250" textAnchor="middle" fontSize="12" className="stage-ink-text">
                    下场口
                  </text>

                  {actors.map((actor, index) => {
                    const position = renderPosition(actor, index);
                    const dragging = draggingId === actor.characterId;
                    const baseName = actor.characterId.split('#')[0];
                    const imageUrl = CHARACTER_IMAGE[baseName];
                    const clipId = `clip-${actor.characterId.replace(/[^a-zA-Z0-9一-龥]/g, '')}`;
                    return (
                      <g
                        key={actor.characterId}
                        data-testid={`actor-${actor.characterId}`}
                        data-x={position.x}
                        data-y={position.y}
                        onPointerDown={(event) => handlePointerDown(event, actor, position)}
                        style={{ cursor: locked ? 'default' : dragging ? 'grabbing' : 'grab' }}
                      >
                        <circle
                          cx={position.x}
                          cy={position.y}
                          r="26"
                          strokeWidth="2"
                          className="stage-actor-circle"
                          style={{
                            stroke: dragging ? 'var(--accent-seal)' : undefined,
                          }}
                        />
                        {!isWire && imageUrl && (
                          <>
                            <clipPath id={clipId}>
                              <circle cx={position.x} cy={position.y} r="26" />
                            </clipPath>
                            <image
                              href={imageUrl}
                              x={position.x - 26}
                              y={position.y - 26}
                              width="52"
                              height="52"
                              clipPath={`url(#${clipId})`}
                              preserveAspectRatio="xMidYMid slice"
                            />
                          </>
                        )}
                        {!isWire && !imageUrl && (
                          <text
                            x={position.x}
                            y={position.y + 5}
                            textAnchor="middle"
                            fontSize="13"
                            className="stage-actor-name"
                          >
                            {actor.label}
                          </text>
                        )}
                        <text
                          x={position.x}
                          y={position.y + 44}
                          textAnchor="middle"
                          fontSize="12"
                          className="stage-actor-caption"
                        >
                          {actor.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="timeline-controls" aria-label="时间轴控制">
              <button type="button" className="timeline-play" onClick={togglePlay} aria-label={isPlaying ? '暂停' : '播放'}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="timeline-clock">
                {formatTime(currentTime)} / {formatTime(DURATION)}
              </span>
              <input
                type="range"
                className="timeline-scrub"
                min="0"
                max={DURATION}
                step="1"
                value={Math.round(currentTime)}
                aria-label="时间轴进度"
                onChange={(event) => seekTo(Number(event.target.value))}
              />
              <button type="button" className="btn-ghost btn-small timeline-step" onClick={() => seekTo(currentTime - 5)} aria-label="后退5秒">
                <ChevronLeft size={15} />
              </button>
              <button type="button" className="btn-ghost btn-small timeline-step" onClick={() => seekTo(currentTime + 5)} aria-label="前进5秒">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* 底部舞台调度卡片 */}
          <div className="dispatch-card panel-card">
            <div className="dispatch-head">
              <h3 className="blocking-aside-title">舞台调度</h3>
              <div className="dispatch-tabs" role="tablist" aria-label="调度分类">
                {DISPATCH_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={dispatchTab === tab.id}
                    className={'dispatch-tab' + (dispatchTab === tab.id ? ' is-active' : '')}
                    onClick={() => setDispatchTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <ul className="dispatch-list">
              {dispatchItems.length === 0 ? (
                <li className="muted text-xs">暂无调度信息。</li>
              ) : (
                dispatchItems.map((item) => (
                  <li key={item.id} className="dispatch-row">
                    <span className="dispatch-dot" />
                    <span className="dispatch-desc">{item.desc}</span>
                    <span className="dispatch-time">{formatTime(item.time)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <aside className="blocking-cues panel-card">
          <div className="blocking-cues-head">
            <h3 className="blocking-aside-title">技术提示 Cue</h3>
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              disabled={readOnly}
              className="btn-seal px-3 py-1 text-xs"
            >
              添加提示
            </button>
          </div>

          {showForm && (
            <div className="cue-form">
              <label htmlFor="cue-department">部门</label>
              <select
                id="cue-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="field"
              >
                {DEPARTMENTS.map((value) => (
                  <option key={value} value={value}>
                    {DEPARTMENT_LABELS[value] || value}
                  </option>
                ))}
              </select>

              <label htmlFor="cue-content">内容</label>
              <input
                id="cue-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="例如：加定点"
                className="field"
              />

              <label htmlFor="cue-quote">绑定台词</label>
              <select
                id="cue-quote"
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                className="field"
              >
                <option value="">不绑定</option>
                {lines.map((line) => (
                  <option key={line.text} value={line.text}>
                    {line.speaker ? `${line.speaker}：${line.text}` : line.text}
                  </option>
                ))}
              </select>

              <label htmlFor="cue-action">绑定动作</label>
              <select
                id="cue-action"
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  if (event.target.value) setQuote('');
                }}
                className="field"
              >
                <option value="">不绑定动作</option>
                {sceneDirections.map((d, i) => (
                  <option key={`${d}-${i}`} value={d}>{d}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddCue}
                disabled={readOnly || !content.trim()}
                className="btn-seal"
              >
                确认添加
              </button>
            </div>
          )}

          {filteredCues.length === 0 ? (
            <p className="muted mt-3 text-xs">
              {noScene ? '当前场次无提示' : '该分类下暂无提示。'}
            </p>
          ) : (
            <ul className="cue-timeline-list">
              {filteredCues.map((cue, i) => {
                const fired = currentTime >= cue.timecode;
                return (
                  <li
                    key={cue.id}
                    data-testid={`cue-${cue.id}`}
                    className={`cue-row ${fired ? 'is-fired' : ''}`}
                  >
                    <span className="cue-no">{pad2(i + 1)}</span>
                    <div className="cue-row-body">
                      <div className="cue-row-meta">
                        <span className="cue-dept">{DEPARTMENT_LABELS[cue.department] || cue.department}</span>
                        <span className="cue-time">{formatTime(cue.timecode)}</span>
                      </div>
                      <p className="cue-content-text">{cue.content}</p>
                      <div className="cue-row-actions">
                        <select
                          aria-label={`提示状态 ${cue.content}`}
                          value={cue.status || 'draft'}
                          disabled={readOnly}
                          onChange={(event) =>
                            dispatch?.({ type: 'updateCue', id: cue.id, patch: { status: event.target.value } })
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
                          disabled={readOnly}
                          className="text-action"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
