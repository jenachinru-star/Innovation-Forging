import { useEffect, useRef } from 'react';

function buildOption(scriptData) {
  const names = Array.from(
    new Set([
      ...(scriptData.characters || []).map((c) => c.name),
      ...(scriptData.relationships || []).flatMap((r) => [r.from, r.to]),
    ])
  ).filter(Boolean);

  const nodes = names.map((n) => ({ name: n, symbolSize: 46 }));
  const links = (scriptData.relationships || []).map((r) => ({
    source: r.from,
    target: r.to,
    value: r.relation,
    label: { show: true, formatter: r.relation },
    lineStyle: {
      color: r.needsReview ? '#a3231f' : '#7d7266',
      width: r.needsReview ? 3 : 1.5,
      type: r.needsReview ? 'dashed' : 'solid',
    },
  }));

  return {
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      label: { show: true, position: 'right', color: '#f2ece1' },
      force: { repulsion: 220, edgeLength: 120 },
      data: nodes,
      links,
      lineStyle: { color: '#7d7266' },
      itemStyle: { color: '#d8b48c' },
    }],
  };
}

export default function RelationGraph({ scriptData }) {
  const ref = useRef(null);
  const relationships = scriptData?.relationships || [];

  useEffect(() => {
    if (!ref.current || relationships.length === 0) return undefined;
    let chart = null;
    let disposed = false;

    import('echarts').then((echarts) => {
      if (disposed || !ref.current) return;
      chart = echarts.init(ref.current);
      chart.setOption(buildOption(scriptData));
    });

    return () => {
      disposed = true;
      if (chart) chart.dispose();
    };
  }, [scriptData, relationships.length]);

  if (relationships.length === 0) {
    return <p className="muted text-sm">暂无足够的人物关系信息。</p>;
  }

  return (
    <div>
      <p className="muted mb-2 text-xs">
        <span className="seal-text">朱红虚线</span> 表示 AI 判断把握不足，建议核实。
      </p>
      <div ref={ref} className="media-area h-[420px] w-full rounded-lg" />
    </div>
  );
}
