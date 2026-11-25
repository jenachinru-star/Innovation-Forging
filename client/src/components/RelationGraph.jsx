import { useEffect, useMemo, useRef, useState } from 'react';

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'review', label: '需核实' },
  { id: 'confirmed', label: '已确认' },
];

// 计算人物在哪些场景出场
function scenesForCharacter(name, scenes) {
  return (scenes || []).filter((scene) => (scene.characters || []).includes(name));
}

function truncate(text, max) {
  const s = String(text || '');
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function buildOption(scriptData, visibleRelationships, selectedName) {
  const names = Array.from(
    new Set([
      ...(scriptData.characters || []).map((c) => c.name),
      ...(scriptData.relationships || []).flatMap((r) => [r.from, r.to]),
    ])
  ).filter(Boolean);

  const profileByName = new Map((scriptData.characters || []).map((c) => [c.name, c]));

  const nodes = names.map((name) => {
    const profile = profileByName.get(name);
    const isSelected = name === selectedName;
    return {
      name,
      fullName: name,
      role: profile?.role || '',
      symbolSize: 72,
      itemStyle: {
        color: '#2f241a',
        borderColor: isSelected ? '#d4af37' : '#86745d',
        borderWidth: isSelected ? 2.4 : 1.4,
      },
      label: {
        show: true,
        position: 'inside',
        formatter: profile?.role
          ? () => `{name|${name}}\n{role|${profile.role}}`
          : () => `{name|${name}}`,
        rich: {
          name: {
            color: '#f2e6d3',
            fontSize: 15,
            fontFamily: 'var(--font-heading)',
            lineHeight: 21,
          },
          role: { color: '#d4af37', fontSize: 11, lineHeight: 16 },
        },
      },
    };
  });

  const links = visibleRelationships.map((r) => ({
    source: r.from,
    target: r.to,
    label: {
      show: false,
      formatter: truncate(r.relation, 12),
      color: '#bda98d',
      fontSize: 11,
      backgroundColor: '#211913',
      padding: [2, 6],
      borderRadius: 3,
    },
    lineStyle: {
      color: r.needsReview ? '#a8332a' : '#86745d',
      width: r.needsReview ? 2 : 1.4,
      type: r.needsReview ? 'dashed' : 'solid',
      curveness: 0.12,
    },
  }));

  return {
    tooltip: { show: false },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        force: { repulsion: 760, edgeLength: [140, 200], gravity: 0.08 },
        label: { show: true },
        data: nodes,
        links,
        emphasis: {
          focus: 'adjacency',
          edgeLabel: { show: true },
        },
      },
    ],
  };
}

export default function RelationGraph({ scriptData }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [selectedName, setSelectedName] = useState(scriptData?.characters?.[0]?.name || '');

  const relationships = scriptData?.relationships || [];
  const characters = scriptData?.characters || [];
  const scenes = scriptData?.scenes || [];

  const stats = useMemo(() => {
    const reviewCount = relationships.filter((r) => r.needsReview).length;
    return {
      people: characters.length,
      relations: relationships.length,
      review: reviewCount,
      confirmed: relationships.length - reviewCount,
      clues: scenes.length,
    };
  }, [relationships, characters, scenes]);

  const visibleRelationships = useMemo(() => {
    if (filter === 'review') return relationships.filter((r) => r.needsReview);
    if (filter === 'confirmed') return relationships.filter((r) => !r.needsReview);
    return relationships;
  }, [relationships, filter]);

  const selectedProfile = useMemo(
    () => characters.find((c) => c.name === selectedName) || characters[0],
    [characters, selectedName]
  );

  const selectedScenes = useMemo(
    () => (selectedProfile ? scenesForCharacter(selectedProfile.name, scenes) : []),
    [selectedProfile, scenes]
  );

  // 初始化 ECharts 并绑定点击
  useEffect(() => {
    let disposed = false;
    Promise.all([
      import('echarts/core'),
      import('echarts/charts'),
      import('echarts/components'),
      import('echarts/renderers'),
    ]).then(([echarts, charts, components, renderers]) => {
      if (disposed || !chartRef.current) return;
      echarts.use([
        charts.GraphChart,
        components.TooltipComponent,
        components.LegendComponent,
        renderers.CanvasRenderer,
      ]);
      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;
      chart.on('click', (params) => {
        if (params.dataType === 'node') setSelectedName(params.data.fullName);
      });
      chart.setOption(buildOption(scriptData, visibleRelationships, selectedName));
    });

    return () => {
      disposed = true;
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
    // 仅在挂载时初始化；后续用 setOption 更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 数据/筛选/选中变化时更新图
  useEffect(() => {
    chartInstanceRef.current?.setOption(
      buildOption(scriptData, visibleRelationships, selectedName)
    );
  }, [scriptData, visibleRelationships, selectedName]);

  const statCards = [
    { label: '人物', value: stats.people, hint: '核心角色', icon: '♙', tone: '' },
    { label: '关系', value: stats.relations, hint: '已确认', icon: '♄', tone: '' },
    { label: '需核实', value: stats.review, hint: '建议确认', icon: '⚠', tone: 'is-warn' },
    { label: '线索', value: stats.clues, hint: '关联场景', icon: '⚑', tone: '' },
  ];

  return (
    <div className="relation-layout">
      <div className="relation-stats">
        {statCards.map((card) => (
          <div key={card.label} className={`relation-stat ${card.tone}`}>
            <div className="relation-stat-main">
              <span className="relation-stat-label">{card.label}</span>
              <b>{card.value}</b>
              <span className="relation-stat-hint">{card.hint}</span>
            </div>
            <span className="relation-stat-icon">{card.icon}</span>
          </div>
        ))}
      </div>

      <section className="relation-center">
        <div className="relation-toolbar">
          <div className="relation-filters" role="group" aria-label="关系筛选">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={'relation-filter' + (filter === item.id ? ' is-active' : '')}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relation-chart-card">
          {relationships.length === 0 ? (
            <p className="muted relation-empty">暂无足够的人物关系信息。</p>
          ) : (
            <div ref={chartRef} className="relation-chart" aria-label="人物关系图" />
          )}
          <div className="relation-legend">
            <span className="legend-line" /> 已确认
            <span className="legend-line legend-dashed" /> 需核实
          </div>
        </div>
      </section>

      <aside className="relation-side">
        <div className="relation-card">
          <h3 className="relation-card-title">人物档案</h3>
          {selectedProfile ? (
            <>
              <p className="relation-role">{selectedProfile.role || '角色'}</p>
              <p className="relation-desc">{selectedProfile.description || '暂无人物描述。'}</p>
              <div className="relation-scene-label">出场场景</div>
              <div className="relation-scene-tags">
                {selectedScenes.length ? (
                  selectedScenes.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      className="relation-scene-tag"
                      onClick={() => setSelectedName(selectedProfile.name)}
                    >
                      {scene.title || `第 ${scene.sceneNumber} 场`}
                    </button>
                  ))
                ) : (
                  <span className="muted text-xs">—</span>
                )}
              </div>
            </>
          ) : (
            <p className="muted text-sm">暂无人选。</p>
          )}
        </div>

        <div className="relation-card">
          <h3 className="relation-card-title">关系速览</h3>
          <ul className="relation-list">
            {relationships.map((rel, index) => (
              <li
                key={`${rel.from}-${rel.to}-${index}`}
                className={rel.needsReview ? 'is-review' : ''}
              >
                <button
                  type="button"
                  className="relation-list-item"
                  onClick={() => setSelectedName(rel.from)}
                >
                  <span className="relation-list-names">
                    {rel.from} — {rel.to}
                  </span>
                  <span className="relation-list-type">{rel.relation}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
