function Icon({ path, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  doc: 'M7 3h7l4 4v14H7V3Zm7 0v4h4M9 12h7M9 16h7M9 8h2',
  people: 'M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 10 11Zm9 8v-1.2a3 3 0 0 0-2.4-2.9M15.5 4.7a3.2 3.2 0 0 1 0 6.2',
  clipboard: 'M8 4h8v3H8V4ZM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M9 12h6M9 16h4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2',
  check: 'M5 12.5 10 17l9-10',
};

function sceneMinutes(scenes) {
  return scenes.reduce((sum, scene) => sum + (Number(scene?.estimatedMinutes) || 0), 0);
}

export default function ProjectOverview({ scriptData, plan, versions = [], onNavigate }) {
  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];
  const characters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];
  const impacts = Array.isArray(plan?.impacts) ? plan.impacts.filter((item) => item.status === 'open') : [];
  const briefs = Array.isArray(plan?.briefs) ? plan.briefs : [];
  const reviewBriefs = briefs.filter((item) => item.status === 'review');
  const pendingCount = impacts.length + reviewBriefs.length;

  const segments = Array.isArray(plan?.segments) ? plan.segments : [];
  const placements = Array.isArray(plan?.staging?.placements) ? plan.staging.placements : [];
  const rehearsals = Array.isArray(plan?.rehearsals) ? plan.rehearsals : [];
  const assets = Array.isArray(plan?.assets) ? plan.assets : [];
  const minutes = sceneMinutes(scenes);
  const summary = String(scriptData?.summary || '').trim();

  const stats = [
    { icon: ICONS.doc, label: '场次', value: scenes.length },
    { icon: ICONS.people, label: '角色', value: characters.length },
    { icon: ICONS.clipboard, label: '待处理', value: pendingCount, alert: pendingCount > 0 },
    { icon: ICONS.clock, label: '预计时长', value: minutes, unit: '分钟' },
  ];

  const chainSteps = [
    { label: '作品', state: scenes.length ? 'done' : 'todo' },
    {
      label: '拆解',
      state: briefs.length || segments.length ? 'done' : scenes.length ? 'active' : 'todo',
    },
    { label: '排演', state: placements.length || rehearsals.length ? 'done' : 'todo' },
    { label: '交付', state: plan?.style || assets.length ? 'done' : 'todo' },
  ];

  const todos = [];
  if (reviewBriefs.length) todos.push({ label: '待核实部门需求', meta: '部门·需求', id: 'briefs' });
  if (impacts.length) todos.push({ label: '待处理排练影响', meta: '排练·影响', id: 'rehearsal' });
  if (!plan?.style) todos.push({ label: '确定视觉方向', meta: '视觉·风格', id: 'visuals' });
  if (!todos.length) todos.push({ label: '确认走位与提示', meta: '舞台·调度', id: 'stage' });

  return (
    <section className="ov2" aria-labelledby="ov2-title">
      <header className="ov2-head">
        <span className="ov2-eyebrow">— 项目总览</span>
        <h1 id="ov2-title">
          {plan?.name || '我的舞台方案'}
          <svg className="ov2-mask" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 5v10a8 8 0 0 0 16 0V5M4 5c0 4 3.6 6 8 6s8-2 8-6M9 10h.01M15 10h.01"
              fill="none"
              stroke="var(--cue)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </h1>
        {summary && <p className="ov2-summary">{summary}</p>}
      </header>

      <div className="ov2-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`ov2-stat ${stat.alert ? 'is-alert' : ''}`}>
            <span className="ov2-stat-icon">
              <Icon path={stat.icon} />
            </span>
            <span className="ov2-stat-label">{stat.label}</span>
            <b>
              {stat.value}
              {stat.unit && <small className="ov2-stat-unit">{stat.unit}</small>}
            </b>
          </div>
        ))}
      </div>

      <div className="ov2-card">
        <div className="ov2-card-head">
          <b>制作链路</b>
          <span>从剧本到舞台，按实际进度推进</span>
        </div>
        <div className="ov2-chain">
          {chainSteps.map((step, index) => (
            <div className={`ov2-chain-node is-${step.state}`} key={step.label}>
              <span className={`ov2-chain-dot is-${step.state}`}>
                {step.state === 'done' ? <Icon path={ICONS.check} size={16} /> : step.state === 'active' ? <i className="ov2-chain-current" /> : null}
              </span>
              <span>{step.label}</span>
              {index < chainSteps.length - 1 && <span className="ov2-chain-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="ov2-card">
        <div className="ov2-card-head">
          <b>待办</b>
          <span className={`ov2-badge ${pendingCount ? 'is-alert' : ''}`}>
            {pendingCount || todos.length} 项待处理
          </span>
        </div>
        <ul className="ov2-todos">
          {todos.map((todo) => (
            <li key={todo.id}>
              <button type="button" className="ov2-todo" onClick={() => onNavigate(todo.id)}>
                <span className="ov2-todo-bar" aria-hidden="true" />
                <span className="ov2-todo-label">{todo.label}</span>
                <span className="ov2-todo-meta">{todo.meta}</span>
                <span className="ov2-todo-arrow" aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
