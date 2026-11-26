// 统一资产类型：图片六类 + 视频
export const ASSET_TYPES = [
  'character',
  'scene',
  'prop',
  'keyframe',
  'poster',
  'image',
  'video',
];

export const ASSET_TYPE_LABELS = {
  character: '人物',
  scene: '场景',
  prop: '道具',
  keyframe: '关键帧',
  poster: '海报',
  image: '通用',
  video: '视频',
};

export function isVideoAsset(asset) {
  return asset?.type === 'video';
}

export function assetTypeLabel(type) {
  return ASSET_TYPE_LABELS[type] || '通用';
}

// 关键字搜索：匹配标题、人物名、提示词
function matchesKeyword(asset, keyword) {
  const kw = String(keyword || '').trim().toLowerCase();
  if (!kw) return true;
  const hay = [asset?.title, asset?.characterName, asset?.prompt]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(kw);
}

/**
 * 统一筛选：按类型 + 关键字，仅保留含 url 的可用资产。
 * @param {Array} assets plan.assets
 * @param {{type?:string,keyword?:string}} options
 */
export function selectAssets(assets, { type = 'all', keyword = '' } = {}) {
  const list = Array.isArray(assets) ? assets : [];
  return list.filter(
    (a) =>
      a &&
      a.url &&
      (type === 'all' || a.type === type) &&
      matchesKeyword(a, keyword)
  );
}

// 按类型统计数量（含全部），未知类型归入通用
export function countByType(assets) {
  const list = Array.isArray(assets) ? assets : [];
  const usable = list.filter((a) => a?.url);
  const counts = { all: usable.length };
  for (const t of ASSET_TYPES) counts[t] = 0;
  for (const a of usable) {
    const key = ASSET_TYPES.includes(a.type) ? a.type : 'image';
    counts[key] += 1;
  }
  return counts;
}
