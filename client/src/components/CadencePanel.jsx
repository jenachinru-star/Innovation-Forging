const DEPARTMENTS = {
  lighting: '灯光',
  music: '音乐',
  sound: '音响',
  scenery: '舞美',
};

const STRUCTURES = ['铺垫', '高潮', '结尾'];

function toMinutes(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function departmentLabel(department) {
  return DEPARTMENTS[department] || department || '未分组';
}

function briefSummary(brief) {
  if (!brief) return '';
  if (brief.original) return brief.original;
  const items = Array.isArray(brief.items) ? brief.items : [];
  if (items.length) return items.join('、');
  return brief.note || '';
}

export default function CadencePanel({ scenes = [], briefs = [], onChange }) {
  const list = Array.isArray(scenes) ? scenes : [];
  const minutes = list.map((scene) => toMinutes(scene?.estimatedMinutes));
  const maxMinutes = Math.max(0, ...minutes);
  const denominator = maxMinutes > 0 ? maxMinutes : 1;

  const timeline = (Array.isArray(briefs) ? briefs : [])
    .filter((brief) => brief && brief.dueDate)
    .slice()
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return (
    <div className="panel-card">
      <h3 className="mb-3 text-sm font-medium">节奏</h3>
      {list.length === 0 ? (
        <p className="muted text-sm">暂无可展示的场次。</p>
      ) : (
        <div className="space-y-2">
          {list.map((scene, idx) => {
            const minutesValue = minutes[idx];
            const pct = Math.round((minutesValue / denominator) * 100);
            return (
              <div key={`${scene?.sceneNumber}-${scene?.title}`} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0">{scene?.title || `第 ${scene?.sceneNumber} 场`}</span>
                <span className="muted w-14 shrink-0">{minutesValue} 分钟</span>
                <div
                  className="h-3 flex-1 rounded"
                  style={{ backgroundColor: 'var(--line)' }}
                >
                  <div
                    data-testid="cadence-bar"
                    data-scene={scene?.sceneNumber}
                    style={{ width: `${pct}%`, backgroundColor: 'var(--ink)' }}
                    className="h-3 rounded"
                  />
                </div>
                <select
                  value={scene?.structure || ''}
                  onChange={(e) => onChange?.(idx, { structure: e.target.value })}
                  className="field px-1 py-0.5 text-xs"
                >
                  <option value="">未标注</option>
                  {STRUCTURES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="mb-3 mt-6 text-sm font-medium">部门准备时间线</h3>
      {timeline.length === 0 ? (
        <p className="muted text-sm">暂无带截止日期的部门准备事项。</p>
      ) : (
        <ul
          className="zebra overflow-hidden rounded-md border text-sm"
          style={{ borderColor: 'var(--line)' }}
        >
          {timeline.map((brief) => (
            <li
              key={brief.id}
              data-testid="cadence-brief"
              className="flex gap-3 border-b px-2 py-1"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="muted w-24 shrink-0">{brief.dueDate}</span>
              <span className="w-12 shrink-0">{departmentLabel(brief.department)}</span>
              <span className="flex-1">{briefSummary(brief)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
