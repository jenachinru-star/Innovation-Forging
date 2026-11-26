import { useState } from 'react';
import { toCsv, toFountain, toHtml, toPropsCsv, toCharacterAppearanceCsv } from '@director/shared/export/index.js';
import { DEPARTMENT_LABELS } from '@director/shared/rules/briefs.js';

const UNSUPPORTED_MESSAGE = '当前环境不支持下载，可改用浏览器打印（Ctrl+P）';

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
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false;
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  if (typeof anchor.click !== 'function') {
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
    return false;
  }
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  if (typeof URL.revokeObjectURL === 'function') {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return true;
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
    场次: brief.sceneNumber != null ? `第 ${brief.sceneNumber} 场` : '',
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
  const [notice, setNotice] = useState('');

  function announce(ok) {
    setNotice(ok ? '' : UNSUPPORTED_MESSAGE);
  }

  function exportCsv(label, content) {
    const ok = download(
      `${safeName(planName)}-${label}-${timestamp()}.csv`,
      content,
      'text/csv;charset=utf-8'
    );
    announce(ok);
  }

  function exportAll() {
    const html = toHtml({ title: planName, scriptData, plan, now: new Date() });
    const ok = download(
      `${safeName(planName)}-排演材料-${timestamp()}.html`,
      html,
      'text/html;charset=utf-8'
    );
    announce(ok);
  }

  function exportFountain() {
    const ok = download(
      `${safeName(planName)}-${timestamp()}.fountain`,
      toFountain({ title: planName, scriptData }),
      'text/plain;charset=utf-8'
    );
    announce(ok);
  }

  function exportProjectArchive() {
    const archive = {
      format: 'kaipai-project',
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        name: planName,
        summary: scriptData?.summary || '',
        updatedAt: new Date().toISOString(),
        scriptData,
        plan,
      },
    };
    const ok = download(
      `${safeName(planName)}-项目归档-${timestamp()}.kaipai.json`,
      JSON.stringify(archive, null, 2),
      'application/json;charset=utf-8'
    );
    announce(ok);
  }

  return (
    <div>
      <p className="muted mb-4 text-sm">
        导出当前方案的排演材料，文件名包含方案名与生成时间。
      </p>
      {notice && (
        <p role="status" className="alert-note mb-4 p-3 text-sm">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => exportCsv('排演准备表', scheduleCsv(scriptData))}
          className="btn-seal px-4 py-2 text-sm"
        >
          排演准备表
        </button>
        <button
          type="button"
          onClick={() => exportCsv('部门需求单', briefCsv(plan))}
          className="btn-seal px-4 py-2 text-sm"
        >
          部门需求单
        </button>
        <button
          type="button"
          onClick={() => exportCsv('走位与提示', stagingCsv(plan))}
          className="btn-seal px-4 py-2 text-sm"
        >
          走位与提示
        </button>
        <button
          type="button"
          onClick={() => exportCsv('道具清单', toPropsCsv(scriptData))}
          className="btn-seal px-4 py-2 text-sm"
        >
          道具清单
        </button>
        <button
          type="button"
          onClick={() => exportCsv('人物出场', toCharacterAppearanceCsv(scriptData))}
          className="btn-seal px-4 py-2 text-sm"
        >
          人物出场
        </button>
        <button
          type="button"
          onClick={exportAll}
          className="btn-primary px-4 py-2 text-sm"
        >
          全部
        </button>
        <button type="button" onClick={exportFountain} className="btn-ghost px-4 py-2 text-sm">
          Fountain 剧本
        </button>
        <button type="button" onClick={exportProjectArchive} className="btn-ghost px-4 py-2 text-sm">
          项目归档
        </button>
      </div>
    </div>
  );
}
