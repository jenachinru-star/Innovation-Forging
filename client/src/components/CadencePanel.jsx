const RHYTHM_CYCLE = ['', '铺垫', '转折', '结尾'];

const RHYTHM_COLOR = {
  铺垫: 'var(--accent-seal)',
  转折: 'var(--cue)',
  结尾: 'var(--confirmed)',
};

// 取标题里冒号后的短名；没有冒号则去掉“第 x 场”前缀
function shortTitle(scene) {
  const full = scene?.title || `第${scene?.sceneNumber}场`;
  if (/[：:]/.test(full)) {
    const tail = full.split(/[：:]/).pop().trim();
    if (tail) return tail;
  }
  return full.replace(/^第[一二三四五六七八九十百\d]+场\s*/, '').trim() || full;
}

export default function CadencePanel({ scenes = [], onChange }) {
  const list = Array.isArray(scenes) ? scenes : [];

  function cycle(index) {
    if (typeof onChange !== 'function') return;
    const current = list[index]?.structure || '';
    const next = RHYTHM_CYCLE[(RHYTHM_CYCLE.indexOf(current) + 1) % RHYTHM_CYCLE.length];
    onChange(index, { structure: next });
  }

  return (
    <div className="cadence-card">
      <h3 className="cadence-title">剧作节奏</h3>
      {list.length === 0 ? (
        <p className="muted text-sm">暂无可展示的场次。</p>
      ) : (
        <div className="cadence-axis">
          <span className="cadence-rail" aria-hidden="true" />
          {list.map((scene, index) => {
            const rhythm = scene.structure || '';
            return (
              <div className="cadence-node" key={`${scene.sceneNumber}-${scene.title}`}>
                <button
                  type="button"
                  className={'cadence-dot' + (rhythm ? '' : ' is-empty')}
                  style={{ backgroundColor: RHYTHM_COLOR[rhythm] || 'var(--line)' }}
                  onClick={() => cycle(index)}
                  aria-label={`第 ${scene.sceneNumber} 场节奏：${rhythm || '未标注'}，点击切换`}
                />
                <span className="cadence-node-label">
                  <b>{scene.sceneNumber}</b> {shortTitle(scene)}
                </span>
              </div>
            );
          })}
          <span className="cadence-end">高潮收束</span>
        </div>
      )}
      <p className="cadence-caption">一场戏的节奏，决定观众的呼吸</p>
    </div>
  );
}
