import { toCsv, toHtml } from '@director/shared/export/index.js';
import { DEPARTMENT_LABELS } from '@director/shared/rules/briefs.js';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function timestamp(date = new Date()) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-${pad2(
    date.getHours()
  )}${pad2(date.getMinutes())}`;
}

function safeName(value, fallback) {
  const base = String(value || fallback || '舞台方案').trim();
  return base.replace(/[\\/:*?"<>|]/g, '-');
}

function joinList(value) {
  return (Array.isArray(value) ? value : []).map(String).filter(Boolean).join('、');
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click?.();
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function scheduleCsv(scriptData) {
  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];
  const rows = scenes.map((scene) => ({
    场次: scene.title || `第 ${scene.sceneNumber ?? ''} 场`,
    地点: scene.location || '',
    出场人物: joinList(scene.characters),
    在场人物: joinList(scene.presentCharacters),
    道具: joinList(scene.props),
    舞台说明: joinList(scene.stageDirections),
    时长: `${scene.estimatedMinutes ?? 0} 分钟`,
    剧情摘要: scene.summary || '',
  }));
  return toCsv(rows, ['场次', '地点', '出场人物', '在场人物', '道具', '舞台说明', '时长', '剧情摘要']);
}

function briefCsv(plan) {
  const briefs = Array.isArray(plan?.briefs) ? plan.briefs : [];
  const rows = briefs.map((brief) => ({
    部门: DEPARTMENT_LABELS[brief.department] || '待确认',
    场次: brief.sceneNumber ?? '',
    原话: brief.original || '',
    条目: joinList(brief.items),
    待确认: joinList(brief.uncertain),
    状态: brief.status || 'draft',
    截止: brief.dueDate || '',
  }));
  return toCsv(rows, ['部门', '场次', '原话', '条目', '待确认', '状态', '截止']);
}

function stagingCsv(plan) {
  const placements = Array.isArray(plan?.staging?.placements) ? plan.staging.placements : [];
  const cues = Array.isArray(plan?.cues) ? plan.cues : [];
  const rows = [
    ...placements.map((placement) => ({
      类型: '走位',
      部门: '',
      场次: placement.sceneNumber ?? '',
      内容: `${placement.characterId || ''} (${placement.x}, ${placement.y})`,
    })),
    ...cues.map((cue) => ({
      类型: '提示',
      部门: DEPARTMENT_LABELS[cue.department] || cue.department || '',
      场次: cue.sceneNumber ?? '',
      内容: `${cue.content || ''}${cue.trigger?.quote ? `（绑定：${cue.trigger.quote}）` : ''}`,
    })),
  ];
  return toCsv(rows, ['类型', '部门', '场次', '内容']);
}

export default function ExportPanel({ title, scriptData, plan }) {
  const planName = title || plan?.name || '舞台方案';

  function exportCsv(label, content) {
    download(`${safeName(planName)}-${label}-${timestamp()}.csv`, content, 'text/csv;charset=utf-8');
  }

  function exportAll() {
    const html = toHtml({ title: planName, scriptData, plan, now: new Date() });
    download(`${safeName(planName)}-排演材料-${timestamp()}.html`, html, 'text/html;charset=utf-8');
  }

  return (
    <div>
      <p className="mb-4 text-sm text-stone-400">
        导出当前方案的排演材料，文件名包含方案名与生成时间。
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => exportCsv('排演准备表', scheduleCsv(scriptData))}
          className="rounded-md bg-amber-200 px-4 py-2 text-sm text-stone-900"
        >
          排演准备表
        </button>
        <button
          type="button"
          onClick={() => exportCsv('部门需求单', briefCsv(plan))}
          className="rounded-md bg-amber-200 px-4 py-2 text-sm text-stone-900"
        >
          部门需求单
        </button>
        <button
          type="button"
          onClick={() => exportCsv('走位与提示', stagingCsv(plan))}
          className="rounded-md bg-amber-200 px-4 py-2 text-sm text-stone-900"
        >
          走位与提示
        </button>
        <button
          type="button"
          onClick={exportAll}
          className="rounded-md border border-amber-200 px-4 py-2 text-sm text-amber-200"
        >
          全部
        </button>
      </div>
    </div>
  );
}
