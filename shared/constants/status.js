/**
 * 业务实体状态枚举（shared 纯数据层，不依赖 DOM/服务端）。
 *
 * 注意：各实体状态互相独立，不要合并成一套通用枚举。
 * 取值字符串与既有持久化数据保持兼容，只抽常量，不改取值。
 *
 * 未纳入本模块：
 * - 录音 hook 本地态 idle/recording/paused（不入库）；
 * - 项目卡片中文展示文案、总览链路态 todo/active/done；
 * - 上游视频任务状态（来自外部服务）。
 */

// ---------- 需求 brief ----------
export const BRIEF_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  IMPLEMENTED: 'implemented',
  NEEDS_REVIEW: 'needsReview',
};

export const BRIEF_STATUS_VALUES = Object.values(BRIEF_STATUS);

export const BRIEF_STATUS_LABELS = {
  [BRIEF_STATUS.DRAFT]: '草稿',
  [BRIEF_STATUS.SUBMITTED]: '已提交',
  [BRIEF_STATUS.CONFIRMED]: '已确认',
  [BRIEF_STATUS.IMPLEMENTED]: '已实施',
  [BRIEF_STATUS.NEEDS_REVIEW]: '待确认',
};

/** 供下拉使用的 [value, label] 二元组 */
export const BRIEF_STATUS_OPTIONS = BRIEF_STATUS_VALUES.map((value) => [
  value,
  BRIEF_STATUS_LABELS[value],
]);

/** 需求是否已办结（已确认 / 已实施） */
export function isBriefDone(status) {
  return status === BRIEF_STATUS.CONFIRMED || status === BRIEF_STATUS.IMPLEMENTED;
}

// ---------- 提示 cue ----------
export const CUE_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  CONFIRMED: 'confirmed',
};

export const CUE_STATUS_VALUES = Object.values(CUE_STATUS);

export const CUE_STATUS_LABELS = {
  [CUE_STATUS.DRAFT]: '草案',
  [CUE_STATUS.REVIEW]: '待复核',
  [CUE_STATUS.CONFIRMED]: '已确认',
};

export const CUE_STATUS_OPTIONS = CUE_STATUS_VALUES.map((value) => [
  value,
  CUE_STATUS_LABELS[value],
]);

// ---------- 影响项 impact ----------
// dismissed（暂缓）为 UI 既有终态，此前未在枚举中声明，本期补全。
export const IMPACT_STATUS = {
  OPEN: 'open',
  ACCEPTED: 'accepted',
  KEPT_OLD: 'keptOld',
  DISMISSED: 'dismissed',
};

export const IMPACT_STATUS_VALUES = Object.values(IMPACT_STATUS);

export const IMPACT_STATUS_LABELS = {
  [IMPACT_STATUS.OPEN]: '待处理',
  [IMPACT_STATUS.ACCEPTED]: '更新',
  [IMPACT_STATUS.KEPT_OLD]: '保留旧版',
  [IMPACT_STATUS.DISMISSED]: '暂缓',
};

/** 影响项处置操作（open 之外的三个终态动作） */
export const IMPACT_ACTION_OPTIONS = [
  [IMPACT_STATUS.ACCEPTED, IMPACT_STATUS_LABELS[IMPACT_STATUS.ACCEPTED]],
  [IMPACT_STATUS.KEPT_OLD, IMPACT_STATUS_LABELS[IMPACT_STATUS.KEPT_OLD]],
  [IMPACT_STATUS.DISMISSED, IMPACT_STATUS_LABELS[IMPACT_STATUS.DISMISSED]],
];

/** 影响项是否已处置（非 open） */
export function isImpactSettled(status) {
  return Boolean(status) && status !== IMPACT_STATUS.OPEN;
}

// ---------- 资产 asset ----------
export const ASSET_STATUS = {
  SELECTED: 'selected',
  STALE: 'stale',
};

export const ASSET_STATUS_VALUES = Object.values(ASSET_STATUS);

export const ASSET_STATUS_LABELS = {
  [ASSET_STATUS.SELECTED]: '已选用',
  [ASSET_STATUS.STALE]: '待更新',
};

// ---------- 讨论 discussion ----------
export const DISCUSSION_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
};

export const DISCUSSION_STATUS_VALUES = Object.values(DISCUSSION_STATUS);

export const DISCUSSION_STATUS_LABELS = {
  [DISCUSSION_STATUS.DRAFT]: '草稿',
  [DISCUSSION_STATUS.PROCESSING]: '分析中',
  [DISCUSSION_STATUS.DONE]: '已完成',
  [DISCUSSION_STATUS.ERROR]: '分析失败',
};

// ---------- 合法流转（本期仅声明，不在组件强制拦截；后续接状态机时复用） ----------
export const STATUS_FLOW = {
  brief: {
    [BRIEF_STATUS.DRAFT]: [BRIEF_STATUS.SUBMITTED, BRIEF_STATUS.NEEDS_REVIEW],
    [BRIEF_STATUS.SUBMITTED]: [BRIEF_STATUS.CONFIRMED, BRIEF_STATUS.NEEDS_REVIEW],
    [BRIEF_STATUS.NEEDS_REVIEW]: [BRIEF_STATUS.SUBMITTED, BRIEF_STATUS.CONFIRMED],
    [BRIEF_STATUS.CONFIRMED]: [BRIEF_STATUS.IMPLEMENTED],
    [BRIEF_STATUS.IMPLEMENTED]: [],
  },
  cue: {
    [CUE_STATUS.DRAFT]: [CUE_STATUS.REVIEW, CUE_STATUS.CONFIRMED],
    [CUE_STATUS.REVIEW]: [CUE_STATUS.DRAFT, CUE_STATUS.CONFIRMED],
    [CUE_STATUS.CONFIRMED]: [CUE_STATUS.REVIEW],
  },
  impact: {
    [IMPACT_STATUS.OPEN]: [
      IMPACT_STATUS.ACCEPTED,
      IMPACT_STATUS.KEPT_OLD,
      IMPACT_STATUS.DISMISSED,
    ],
    [IMPACT_STATUS.ACCEPTED]: [],
    [IMPACT_STATUS.KEPT_OLD]: [],
    [IMPACT_STATUS.DISMISSED]: [],
  },
  asset: {
    [ASSET_STATUS.SELECTED]: [ASSET_STATUS.STALE],
    [ASSET_STATUS.STALE]: [ASSET_STATUS.SELECTED],
  },
  discussion: {
    [DISCUSSION_STATUS.DRAFT]: [DISCUSSION_STATUS.PROCESSING],
    [DISCUSSION_STATUS.PROCESSING]: [DISCUSSION_STATUS.DONE, DISCUSSION_STATUS.ERROR],
    [DISCUSSION_STATUS.ERROR]: [DISCUSSION_STATUS.PROCESSING],
    [DISCUSSION_STATUS.DONE]: [],
  },
};
