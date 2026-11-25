// 舞台设置（plan.staging.stage）：舞台框/上下场口/网格的结构与默认值。
// 默认值与迁移前硬编码严格一致，旧数据 stage=null 或缺字段自动兜底。

export const DEFAULT_STAGE_SETTINGS = {
  frame: { x: 60, y: 44, width: 680, height: 400 },
  doors: {
    up: { x: 18, y: 200, width: 34, height: 88 },
    down: { x: 748, y: 200, width: 34, height: 88 },
  },
  grid: { showGrid: false, spacing: 40 },
};

function finiteOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// 规整一个矩形（x/y/width/height），缺项回退默认。
export function normalizeRect(raw, fallback) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    x: finiteOr(r.x, fallback.x),
    y: finiteOr(r.y, fallback.y),
    width: finiteOr(r.width, fallback.width),
    height: finiteOr(r.height, fallback.height),
  };
}

export function defaultStageSettings() {
  return mergeStageSettings(DEFAULT_STAGE_SETTINGS);
}

export function mergeStageSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const frame = normalizeRect(source.frame, DEFAULT_STAGE_SETTINGS.frame);
  const doorSource = source.doors && typeof source.doors === 'object' ? source.doors : {};
  const gridSource = source.grid && typeof source.grid === 'object' ? source.grid : {};

  const spacing = finiteOr(gridSource.spacing, DEFAULT_STAGE_SETTINGS.grid.spacing);

  return {
    frame,
    doors: {
      up: normalizeRect(doorSource.up, DEFAULT_STAGE_SETTINGS.doors.up),
      down: normalizeRect(doorSource.down, DEFAULT_STAGE_SETTINGS.doors.down),
    },
    grid: {
      showGrid: gridSource.showGrid === true,
      spacing: spacing > 0 ? spacing : DEFAULT_STAGE_SETTINGS.grid.spacing,
    },
  };
}
