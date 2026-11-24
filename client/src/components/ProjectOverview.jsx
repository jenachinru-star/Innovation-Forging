import { directorById, familyById } from '../data/styles.js';

function sceneMinutes(scenes) {
  return scenes.reduce((sum, scene) => sum + (Number(scene?.estimatedMinutes) || 0), 0);
}

export default function ProjectOverview({ scriptData, plan, versions = [], onNavigate }) {
  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];
  const characters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];
  const impacts = Array.isArray(plan?.impacts) ? plan.impacts.filter((item) => item.status === 'open') : [];
  const briefs = Array.isArray(plan?.briefs) ? plan.briefs : [];
  const styleFamily = plan?.style?.familyId ? familyById(plan.style.familyId) : null;
  const styleDirector = plan?.style?.directorId ? directorById(plan.style.directorId) : null;
  const nextScene = scenes.find((scene) => !scene?.structure) || scenes[0];
  const firstAction = impacts.length
    ? { label: '先处理修改影响', id: 'rehearsal' }
    : !plan?.style
      ? { label: '确定视觉方向', id: 'visuals' }
      : { label: '检查部门需求', id: 'briefs' };

  return (
    <section className="overview-page" aria-labelledby="overview-title">
      <header className="overview-head">
        <div>
          <span className="eyebrow">00 · 项目总览</span>
          <h1 id="overview-title">{plan?.name || '我的舞台方案'}</h1>
          <p>{scriptData?.summary || '从剧本建立场次、人物与部门准备之间的制作链路。'}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => onNavigate(firstAction.id)}>
          {firstAction.label}
        </button>
      </header>

      <div className="overview-ledger">
        <div>
          <span>场次</span>
          <b>{scenes.length}</b>
        </div>
        <div>
          <span>人物</span>
          <b>{characters.length}</b>
        </div>
        <div>
          <span>预计时长</span>
          <b>{sceneMinutes(scenes)}′</b>
        </div>
        <div>
          <span>待处理</span>
          <b className={impacts.length ? 'is-alert' : ''}>{impacts.length + briefs.filter((item) => item.status === 'review').length}</b>
        </div>
        <div>
          <span>剧本版本</span>
          <b>{versions.length || 1}</b>
        </div>
      </div>

      <div className="overview-grid">
        <article className="overview-scene-list">
          <div className="section-heading">
            <div>
              <span className="field-label">当前编排</span>
              <h2>场次节奏</h2>
            </div>
            <button type="button" className="text-action" onClick={() => onNavigate('breakdown')}>
              查看拆解
            </button>
          </div>
          {scenes.length === 0 ? (
            <p className="empty-copy">还没有场次。先回到剧本确认原文。</p>
          ) : (
            <ol>
              {scenes.map((scene, index) => (
                <li key={scene.id || scene.sceneNumber || index}>
                  <span className="scene-number">{String(scene.sceneNumber || index + 1).padStart(2, '0')}</span>
                  <span className="scene-copy">
                    <b>{scene.title || scene.location || `第 ${index + 1} 场`}</b>
                    <small>
                      {(scene.presentCharacters || scene.characters || []).join('、') || '人物待确认'} ·{' '}
                      {scene.estimatedMinutes || 0} 分钟
                    </small>
                  </span>
                  <span className={`status-stamp ${scene.structure ? 'status-confirmed' : 'status-review'}`}>
                    {scene.structure || '待标结构'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </article>

        <aside className="overview-now">
          <div className="now-card">
            <span className="field-label">下一步</span>
            <h2>{nextScene?.title || nextScene?.location || '从第一场开始'}</h2>
            <p>
              为这一场确定空间关系，再把灯光、音乐、音响和舞美提示绑到具体台词或动作。
            </p>
            <button type="button" className="btn-ghost btn-small" onClick={() => onNavigate('stage')}>
              进入排演台
            </button>
          </div>

          <div className="now-card style-summary">
            <span className="field-label">视觉方向</span>
            {styleFamily ? (
              <>
                <h2>{styleDirector?.name || styleFamily.shortName}</h2>
                <div className="mini-palette" aria-hidden="true">
                  {(styleDirector?.palette || styleFamily.colors).map((color) => (
                    <i key={color} style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p>{styleDirector?.summary || styleFamily.description}</p>
              </>
            ) : (
              <>
                <h2>尚未确定</h2>
                <p>从 10 个视觉族与 24 位精选导演中建立角色、场景和关键帧的共同语言。</p>
              </>
            )}
            <button type="button" className="btn-ghost btn-small" onClick={() => onNavigate('visuals')}>
              {styleFamily ? '调整视觉方案' : '选择视觉风格'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
