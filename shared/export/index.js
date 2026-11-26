import { DEPARTMENTS, DEPARTMENT_LABELS } from '../rules/briefs.js';

const GROUP_LABELS = { ...DEPARTMENT_LABELS, uncertain: '待确认' };
const GROUP_ORDER = [...DEPARTMENTS, 'uncertain'];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  if (value == null) return '';
  return typeof value === 'string' ? value : String(value);
}

function esc(value) {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function safeColor(value, fallback = '#1c1917') {
  const color = text(value);
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function formatNow(now) {
  if (typeof now === 'string' && now.trim()) return now.trim();
  const date = now instanceof Date ? now : now == null ? new Date() : new Date(now);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function joinList(value) {
  return asArray(value).map(text).filter(Boolean).join('、');
}

function sceneLabel(scene, index) {
  if (!scene) return `第 ${index + 1} 场`;
  if (scene.title) return text(scene.title);
  return `第 ${scene.sceneNumber ?? index + 1} 场`;
}

function table(headers, rows, emptyText) {
  if (rows.length === 0) {
    return `<p class="empty">${esc(emptyText)}</p>`;
  }
  const head = headers.map((header) => `<th>${esc(header)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`
    )
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function sceneSection(scenes) {
  const rows = scenes.map((scene, index) => [
    sceneLabel(scene, index),
    text(scene?.location),
    joinList(scene?.characters),
    joinList(scene?.presentCharacters),
    joinList(scene?.props),
    joinList(scene?.stageDirections),
    scene?.estimatedMinutes != null ? `${scene.estimatedMinutes} 分钟` : '',
    text(scene?.summary),
  ]);

  return `
    <section>
      <h2>排演准备表</h2>
      ${table(
        ['场次', '地点', '出场人物', '在场人物', '道具', '舞台说明', '时长', '剧情摘要'],
        rows,
        '暂无场次。'
      )}
    </section>`;
}

function briefSection(briefs) {
  const groups = new Map();
  for (const brief of asArray(briefs)) {
    if (!brief) continue;
    const key = GROUP_LABELS[brief.department] ? brief.department : 'uncertain';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(brief);
  }

  const sections = GROUP_ORDER.map((department) => {
    const label = GROUP_LABELS[department] || department;
    const items = groups.get(department) || [];
    const body =
      items.length === 0
        ? '<p class="empty">暂无需求。</p>'
        : `<ul class="items">${items
            .map((brief) => {
              const detail = asArray(brief.items).length > 0
                ? ` <span class="muted">（${esc(joinList(brief.items))}）</span>`
                : '';
              const scene = brief.sceneNumber != null
                ? `第 ${esc(brief.sceneNumber)} 场 · `
                : '';
              const uncertain = asArray(brief.uncertain).length > 0
                ? ` <span class="warn">待确认：${esc(joinList(brief.uncertain))}</span>`
                : '';
              return `<li>${scene}${esc(brief.original)}${detail}${uncertain}</li>`;
            })
            .join('')}</ul>`;
    return `<div class="dept"><h3>${esc(label)}</h3>${body}</div>`;
  }).join('');

  return `
    <section>
      <h2>部门需求单</h2>
      ${sections}
    </section>`;
}

function stagingSection(plan) {
  const placements = asArray(plan?.staging?.placements);
  const cues = asArray(plan?.cues);

  const placementItems =
    placements.length === 0
      ? '<p class="empty">暂无走位记录。</p>'
      : `<ul class="items">${placements
          .map(
            (placement) =>
              `<li>第 ${esc(placement?.sceneNumber ?? '?')} 场 · ${esc(
                placement?.characterId
              )} (${esc(placement?.x)}, ${esc(placement?.y)})</li>`
          )
          .join('')}</ul>`;

  const cueItems =
    cues.length === 0
      ? '<p class="empty">暂无技术提示。</p>'
      : `<ul class="items">${cues
          .map((cue) => {
            const label = GROUP_LABELS[cue?.department] || text(cue?.department);
            const scene = cue?.sceneNumber != null ? `第 ${esc(cue.sceneNumber)} 场 · ` : '';
            const quote = cue?.trigger?.quote ? `（绑定：${esc(cue.trigger.quote)}）` : '';
            return `<li>[${esc(label)}] ${scene}${esc(cue?.content)}${quote}</li>`;
          })
          .join('')}</ul>`;

  return `
    <section>
      <h2>走位与提示</h2>
      <h3>走位</h3>
      ${placementItems}
      <h3>技术提示</h3>
      ${cueItems}
    </section>`;
}

function discussionSection(discussions) {
  const list = asArray(discussions).filter(Boolean);
  if (!list.length) return '';

  const miniList = (label, items) =>
    asArray(items).length
      ? `<p class="muted">${esc(label)}</p><ul class="items">${asArray(items)
          .map((x) => `<li>${esc(x)}</li>`)
          .join('')}</ul>`
      : '';

  const blocks = list.map((d) => {
    const s = d?.summary && typeof d.summary === 'object' ? d.summary : {};
    return `
      <div class="disc">
        <h3>${esc(d.title || '讨论')}</h3>
        <p class="muted">${esc(formatNow(d.createdAt))}</p>
        ${d.transcript ? `<p>${esc(d.transcript)}</p>` : ''}
        ${s.overview ? `<p>${esc(s.overview)}</p>` : ''}
        ${miniList('决策', s.decisions)}
        ${miniList('待办', s.todos)}
        ${miniList('变更', s.changes)}
        ${miniList('待确认', s.questions)}
      </div>`;
  }).join('');

  return `
    <section>
      <h2>讨论与复盘纪要</h2>
      ${blocks}
    </section>`;
}

function reviewSection(review) {
  if (!review || typeof review !== 'object') return '';
  const fields = [
    ['goal', '本次目标'],
    ['wentWell', '做得好的'],
    ['improve', '待改进'],
    ['nextActions', '下次行动'],
    ['conclusion', '结论'],
  ];
  const rows = fields
    .filter(([key]) => text(review[key]).trim())
    .map(([key, label]) => `<p><b>${esc(label)}：</b>${esc(review[key])}</p>`)
    .join('');
  if (!rows) return '';
  return `
    <section>
      <h2>手动复盘</h2>
      ${rows}
    </section>`;
}

function collectionSection(collections) {
  const list = asArray(collections).filter(Boolean);
  if (!list.length) return '';
  return `
    <section>
      <h2>资料收藏</h2>
      <ul class="items">${list
        .map((item) => `<li>${esc(item.text)}</li>`)
        .join('')}</ul>
    </section>`;
}

const STYLE = `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #fffdf7;
      color: #1c1917;
      font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", Georgia, serif;
      line-height: 1.7;
    }
    .page { max-width: 900px; margin: 0 auto; padding: 48px 32px; }
    h1 { margin: 0 0 4px; font-size: 26px; letter-spacing: 0.02em; }
    .subtitle { margin: 0 0 32px; color: #78716c; font-size: 13px; }
    section { margin: 0 0 34px; }
    h2 {
      margin: 0 0 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #1c1917;
      font-size: 18px;
    }
    h3 { margin: 16px 0 6px; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #d6cbb8;
      padding: 6px 8px;
      text-align: left;
      font-size: 13px;
      vertical-align: top;
    }
    thead th { background: #f3ead9; }
    .dept { margin: 0 0 14px; }
    .items { margin: 0; padding-left: 20px; }
    .items li { margin: 4px 0; font-size: 13px; }
    .muted { color: #78716c; }
    .warn { color: #b45309; }
    .empty { margin: 4px 0; color: #a8a29e; font-size: 13px; }
    @media print {
      @page { margin: 16mm; }
      body { background: #ffffff; }
      .page { max-width: none; padding: 0; }
      section { break-inside: avoid; }
      h2 { break-after: avoid; }
    }`;

export function toHtml({ title, scriptData, plan, now } = {}) {
  const scenes = asArray(scriptData?.scenes);
  const planName = text(title) || text(plan?.name) || '舞台方案';
  const time = formatNow(now);
  const summary = text(scriptData?.summary);
  const palette = asArray(plan?.style?.palette).map((color, index) =>
    safeColor(color, ['#1c1917', '#746c61', '#d3cabc', '#c18a2d', '#f4f0e8'][index])
  );

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(planName)} · 排演材料</title>
  <style>${STYLE}
    :root {
      --export-ink: ${palette[0] || '#1c1917'};
      --export-cue: ${palette[3] || '#c18a2d'};
      --export-paper: ${palette[4] || '#fffdf7'};
    }
    body { color: var(--export-ink); background: var(--export-paper); }
    h2 { border-bottom-color: var(--export-ink); }
    .style-band { display: flex; height: 10px; margin: 18px 0 28px; }
    .style-band i { flex: 1; }
  </style>
</head>
<body>
  <main class="page">
    <h1>${esc(planName)}</h1>
    <p class="subtitle">排演材料 · 生成时间 ${esc(time)}</p>
    ${
      plan?.style
        ? `<div class="style-band">${palette
            .map((color) => `<i style="background:${color}"></i>`)
            .join('')}</div>
    <p class="subtitle">视觉方向：${esc(plan.style.directorName || plan.style.familyName || '未命名')}</p>`
        : ''
    }

    <section>
      <h2>作品信息</h2>
      <table>
        <tbody>
          <tr><th>方案名</th><td>${esc(planName)}</td></tr>
          <tr><th>生成时间</th><td>${esc(time)}</td></tr>
          <tr><th>场次数</th><td>${scenes.length}</td></tr>
        </tbody>
      </table>
      ${summary ? `<p>${esc(summary)}</p>` : ''}
    </section>

    ${sceneSection(scenes)}
    ${briefSection(plan?.briefs)}
    ${stagingSection(plan)}
    ${discussionSection(plan?.discussions)}
    ${reviewSection(plan?.review)}
    ${collectionSection(plan?.collections)}
  </main>
</body>
</html>`;
}

// 电子表格会把以 = + - @ 开头的单元格当公式执行；纯数字（含负数）保持原样
const FORMULA_START_RE = /^[=+\-@\t\r]/;
const PLAIN_NUMBER_RE = /^[+-]?\d+(\.\d+)?$/;

function csvCell(value) {
  let raw = text(value);
  if (FORMULA_START_RE.test(raw) && !PLAIN_NUMBER_RE.test(raw)) raw = `'${raw}`;
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv(rows, headers) {
  const columns = asArray(headers);
  const list = asArray(rows);
  const lines = [columns.map(csvCell).join(',')];
  for (const row of list) {
    const record = row && typeof row === 'object' ? row : {};
    lines.push(columns.map((column) => csvCell(record[column])).join(','));
  }
  return `\uFEFF${lines.join('\n')}`;
}

export function toFountain({ title, scriptData } = {}) {
  const project = text(title) || text(scriptData?.summary) || '未命名作品';
  const scenes = asArray(scriptData?.scenes);
  const blocks = [
    `Title: ${project}`,
    'Credit: 开排',
    'Draft date: ' + formatNow(new Date()),
    '',
    '====',
    '',
  ];

  for (const scene of scenes) {
    const heading = text(scene?.location) || text(scene?.title) || '未命名场景';
    blocks.push(`INT. ${heading}`);
    blocks.push('');
    for (const direction of asArray(scene?.stageDirections)) {
      blocks.push(`> ${text(direction)}`);
      blocks.push('');
    }
    for (const line of asArray(scene?.lines)) {
      const speaker = text(line?.speaker).toUpperCase();
      const dialogue = text(line?.text);
      if (speaker) blocks.push(speaker);
      if (dialogue) blocks.push(dialogue);
      blocks.push('');
    }
    blocks.push('====');
    blocks.push('');
  }

  return `${blocks.join('\n').trim()}\n`;
}
/**
 * 道具清单 CSV：每场次每道具一行，便于排演前逐项核对。
 */
export function toPropsCsv(scriptData) {
  const scenes = asArray(scriptData?.scenes);
  const rows = [];
  scenes.forEach((scene, index) => {
    const label = sceneLabel(scene, index);
    for (const prop of asArray(scene?.props)) {
      rows.push({ 场次: label, 道具: text(prop) });
    }
  });
  return toCsv(rows, ['场次', '道具']);
}

/**
 * 人物出场统计 CSV：每个人物一行，列出出场场次与次数。
 */
export function toCharacterAppearanceCsv(scriptData) {
  const scenes = asArray(scriptData?.scenes);
  const names = Array.from(
    new Set(asArray(scriptData?.characters).map((c) => c && c.name).filter(Boolean))
  );
  const rows = names.map((name) => {
    const appearances = scenes
      .filter((scene) => asArray(scene?.characters).includes(name))
      .map((scene, index) => sceneLabel(scene, index));
    return { 人物: name, 出场场次: appearances.join('、'), 出场次数: appearances.length };
  });
  return toCsv(rows, ['人物', '出场场次', '出场次数']);
}
