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
      color: r.needsReview ? '#f59e0b' : '#a8a29e',
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
      label: { show: true, position: 'right', color: '#f5ece0' },
      force: { repulsion: 220, edgeLength: 120 },
      data: nodes,
      links,
      lineStyle: { color: '#a8a29e' },
      itemStyle: { color: '#d4a373' },
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
    return <p className="text-sm text-stone-400">暂无足够的人物关系信息。</p>;
  }

  return (
    <div>
      <p className="mb-2 text-xs text-stone-500">
        <span className="text-amber-400">橙色虚线</span> 表示 AI 判断把握不足，建议核实。
      </p>
      <div ref={ref} className="h-[420px] w-full rounded-lg border border-stone-800 bg-stone-900/40" />
    </div>
  );
}
