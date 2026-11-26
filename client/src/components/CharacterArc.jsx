import { useState } from 'react';

const W = 640;
const H = 240;
const PAD = 36;

export default function CharacterArc({ plan, dispatch }) {
  const arcs = Array.isArray(plan?.characterArcs) ? plan.characterArcs : [];
  const [selectedId, setSelectedId] = useState(arcs[0]?.id || '');
  const arc = arcs.find((a) => a.id === selectedId) || arcs[0];

  function chartPoints(beats) {
    if (!beats?.length) return [];
    const stepX = beats.length > 1 ? (W - PAD * 2) / (beats.length - 1) : 0;
    return beats.map((beat, i) => {
      const x = beats.length > 1 ? PAD + i * stepX : W / 2;
      const y = H - PAD - (beat.intensity / 100) * (H - PAD * 2);
      return { x, y, beat };
    });
  }

  function updateBeat(beat, patchObj) {
    dispatch({ type: 'updateArcBeat', arcId: arc.id, beatId: beat.id, patch: patchObj });
  }

  const pts = arc ? chartPoints(arc.beats) : [];
  const linePath = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="character-arc" data-testid="character-arc">
      <div className="ca-list">
        {arcs.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`ca-item ${arc?.id === a.id ? 'is-active' : ''}`}
            onClick={() => setSelectedId(a.id)}
          >
            {a.characterName}
          </button>
        ))}
      </div>

      {arc && (
        <div className="ca-detail">
          <h3>{arc.characterName} 的弧光</h3>
          {pts.length > 0 && (
            <svg viewBox={`0 0 ${W} ${H}`} className="ca-chart" role="img" aria-label="角色弧光曲线">
              {[0, 25, 50, 75, 100].map((v) => {
                const y = H - PAD - (v / 100) * (H - PAD * 2);
                return (
                  <g key={v}>
                    <line x1={PAD} y1={y} x2={W - PAD} y2={y} className="ca-gridline" />
                    <text x={8} y={y + 4} className="ca-axis">
                      {v}
                    </text>
                  </g>
                );
              })}
              <polyline points={linePath} className="ca-line" />
              {pts.map((p) => (
                <g key={p.beat.id}>
                  <circle cx={p.x} cy={p.y} r={5} className="ca-dot" />
                  <text x={p.x} y={H - 12} textAnchor="middle" className="ca-xlabel">
                    {p.beat.sceneNumber}场
                  </text>
                </g>
              ))}
            </svg>
          )}

          <div className="ca-beats">
            {arc.beats.map((beat) => (
              <div key={beat.id} className="ca-beat" data-testid={`beat-${beat.id}`}>
                <span className="ca-beat-scene">{beat.sceneNumber} 场</span>
                <input
                  value={beat.state}
                  placeholder="状态"
                  onChange={(e) => updateBeat(beat, { state: e.target.value })}
                  aria-label="状态"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={beat.intensity}
                  onChange={(e) => updateBeat(beat, { intensity: Number(e.target.value) })}
                  aria-label="强度"
                />
                <span className="ca-intensity">{beat.intensity}</span>
                <input
                  value={beat.note}
                  placeholder="备注"
                  onChange={(e) => updateBeat(beat, { note: e.target.value })}
                  aria-label="备注"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
