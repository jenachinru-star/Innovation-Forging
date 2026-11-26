import { BRIEF_STATUS, IMPACT_STATUS } from '@director/shared/constants/status.js';
import overviewBg from '../assets/visual/overview-bg.jpg';

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
  check: 'M5 12.5 10 17l9-10',
  arrow: 'M9 6l6 6-6 6',
};

function sceneMinutes(scenes) {
  return scenes.reduce((sum, scene) => sum + (Number(scene?.estimatedMinutes) || 0), 0);
}

function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ProjectOverview({ scriptData, plan, versions = [], onNavigate }) {
  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];
  const characters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];
  const impacts = Array.isArray(plan?.impacts)
    ? plan.impacts.filter((item) => item.status === IMPACT_STATUS.OPEN)
    : [];
  const briefs = Array.isArray(plan?.briefs) ? plan.briefs : [];
  const reviewBriefs = briefs.filter((item) => item.status === BRIEF_STATUS.NEEDS_REVIEW);
  const pendingCount = impacts.length + reviewBriefs.length;

  const segments = Array.isArray(plan?.segments) ? plan.segments : [];
  const placements = Array.isArray(plan?.staging?.placements) ? plan.staging.placements : [];
  const rehearsals = Array.isArray(plan?.rehearsals) ? plan.rehearsals : [];
  const assets = Array.isArray(plan?.assets) ? plan.assets : [];
  const discussions = Array.isArray(plan?.discussions) ? plan.discussions : [];
  const minutes = sceneMinutes(scenes);
  const summary = String(scriptData?.summary || '').trim();

  // ---- 制作进度（真实状态 + 真实描述） ----
  const progress = [
    {
      id: 'overview',
      label: '作品',
      state: scenes.length ? 'done' : 'todo',
      desc: scenes.length
        ? `剧本已确认：${scenes.length} 场 · ${characters.length} 角色 · ${minutes} 分钟，工作版本已保存`
        : '等待剧本确认',
    },
    {
      id: 'breakdown',
      label: '拆解',
      state: briefs.length || segments.length ? 'done' : scenes.length ? 'active' : 'todo',
      desc: scenes.length
        ? `场次与人物已就绪，部门需求 ${briefs.length} 项，待输入导演原话并拆分`
        : '剧本确认后开始',
    },
    {
      id: 'stage',
      label: '排演',
      state: placements.length || rehearsals.length ? 'done' : 'todo',
      desc:
        placements.length || rehearsals.length
          ? `已绑定 ${placements.length} 个走位，排练记录 ${rehearsals.length} 条`
          : '走位绑定、技术提示与排练记录将在拆解完成后开放',
    },
    {
      id: 'export',
      label: '交付',
      state: plan?.style || assets.length ? 'done' : 'todo',
      desc:
        plan?.style || assets.length
          ? `视觉方向已确定，素材 ${assets.length} 项，可导出归档`
          : '视觉风格、素材生成与导出归档',
    },
  ];

  const activeEntry = progress.find((item) => item.state === 'active');
  const allDone = progress.every((item) => item.state === 'done');
  const phaseLabel = activeEntry
    ? `制作中 · ${activeEntry.label}阶段`
    : allDone
      ? '已完成'
      : '待开始';

  // ---- 待办（真实，点击直达） ----
  const todos = [];
  if (reviewBriefs.length) todos.push({ label: '待核实部门需求', meta: '部门·需求', id: 'briefs' });
  if (impacts.length) todos.push({ label: '待处理排练影响', meta: '排练·影响', id: 'rehearsal' });
  if (!plan?.style) todos.push({ label: '确定视觉方向', meta: '视觉·风格', id: 'visuals' });
  if (!todos.length) todos.push({ label: '确认走位与提示', meta: '舞台·调度', id: 'stage' });

  // ---- 幕场结构（优先 acts，缺省按 actId 聚合） ----
  const rawActs = Array.isArray(scriptData?.acts) ? scriptData.acts : [];
  const actRows = rawActs.length
    ? rawActs.map((act) => ({
        id: act.id,
        title: act.title || `第 ${act.actNumber} 幕`,
        count: Array.isArray(act.sceneIds) ? act.sceneIds.length : 0,
      }))
    : Object.values(
        scenes.reduce((map, scene) => {
          const key = scene.actId || 'unknown';
          if (!map[key]) map[key] = { id: key, title: scene.structure || '未分幕', count: 0 };
          map[key].count += 1;
          return map;
        }, {})
      );

  // ---- 人物速览（首字母圆形，统一语言） ----
  const people = characters.slice(0, 8).map((character) => ({
    id: character.id,
    name: character.name,
    initial: String(character.name || '?').slice(0, 1),
  }));

  // ---- 最近动态（真实讨论 + 版本） ----
  const recentDiscussions = discussions
    .filter((item) => item.status === 'done')
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 2)
    .map((item) => ({
      id: item.id,
      title: item.title || '讨论纪要',
      date: formatShortDate(item.createdAt),
    }));

  const heroStats = [
    { label: '场次', value: scenes.length },
    { label: '角色', value: characters.length },
    { label: '预计时长', value: minutes, unit: '分钟' },
    { label: '待处理', value: pendingCount, alert: pendingCount > 0 },
  ];

  return (
    <section className="ov3" aria-labelledby="ov3-title">
      <div className="ov3-bg" aria-hidden="true">
        <img className="ov3-bg-img" src={overviewBg} alt="" />
      </div>
      <div className="ov3-mask" aria-hidden="true" />

      <header className="ov3-hero">
        <div className="ov3-hero-main">
          <span className="ov3-badge">{phaseLabel}</span>
          <h1 id="ov3-title">{plan?.name || '我的舞台方案'}</h1>
          {summary && <p className="ov3-hero-summary">{summary}</p>}
        </div>
        <div className="ov3-hero-stats">
          {heroStats.map((stat) => (
            <div key={stat.label} className={`ov3-hero-stat ${stat.alert ? 'is-alert' : ''}`}>
              <b>
                {stat.value}
                {stat.unit && <small>{stat.unit}</small>}
              </b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="ov3-row ov3-row-2">
        <section className="ov3-panel">
          <h2 className="ov3-panel-title">制作进度</h2>
          <ol className="ov3-progress">
            {progress.map((item) => (
              <li key={item.id} className={`ov3-progress-item is-${item.state}`}>
                <span className="ov3-progress-dot">
                  {item.state === 'done' ? (
                    <Icon path={ICONS.check} size={15} />
                  ) : item.state === 'active' ? (
                    <i className="ov3-progress-current" />
                  ) : null}
                </span>
                <div className="ov3-progress-body">
                  <div className="ov3-progress-head">
                    <b>{item.label}</b>
                    <span className="ov3-progress-state">
                      {item.state === 'done'
                        ? '已完成'
                        : item.state === 'active'
                          ? '当前阶段'
                          : '未开始'}
                    </span>
                  </div>
                  <p>{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="ov3-panel">
          <h2 className="ov3-panel-title">待办</h2>
          <ul className="ov3-todos">
            {todos.map((todo) => (
              <li key={todo.id}>
                <button type="button" className="ov3-todo" onClick={() => onNavigate(todo.id)}>
                  <span className="ov3-todo-bar" />
                  <span className="ov3-todo-text">
                    <b>{todo.label}</b>
                    <small>{todo.meta}</small>
                  </span>
                  <Icon path={ICONS.arrow} size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ov3-row ov3-row-3">
        <section className="ov3-panel">
          <h2 className="ov3-panel-title">幕场结构</h2>
          <ul className="ov3-acts">
            {actRows.map((act) => (
              <li key={act.id}>
                <button type="button" className="ov3-act" onClick={() => onNavigate('breakdown')}>
                  <b>{act.title}</b>
                  <span>{act.count} 场</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="ov3-panel">
          <h2 className="ov3-panel-title">人物速览</h2>
          <div className="ov3-people">
            {people.map((person) => (
              <button
                type="button"
                key={person.id}
                className="ov3-person"
                onClick={() => onNavigate('relations')}
              >
                <span className="ov3-person-avatar">{person.initial}</span>
                <small>{person.name}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="ov3-panel">
          <h2 className="ov3-panel-title">最近动态</h2>
          <ul className="ov3-feed">
            {recentDiscussions.map((item) => (
              <li key={item.id}>
                <b>{item.title}</b>
                {item.date && <span>{item.date}</span>}
              </li>
            ))}
            <li>
              <b>剧本工作版</b>
              <span>历史版本 {versions.length} 个</span>
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}
