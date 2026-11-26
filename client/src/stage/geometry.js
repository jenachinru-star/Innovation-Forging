// 画布几何纯函数：逻辑坐标常量与位置/插值计算，不依赖 React，不碰 DOM/Canvas。

export const VIEW_W = 800;
export const VIEW_H = 480;
export const DEFAULT_Y = Math.round(VIEW_H * 0.62);

export function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// 无任何走位记录时的默认站位：沿水平方向均匀分布。
export function defaultPosition(index, total) {
  return {
    x: Math.round((VIEW_W * (index + 1)) / (total + 1)),
    y: DEFAULT_Y,
  };
}

// 从已存储的 placements 中读取某角色在某场景的位置，找不到返回 null。
export function storedPosition(placements, sceneNumber, characterId) {
  const list = Array.isArray(placements) ? placements : [];
  const found = list.find(
    (item) =>
      item &&
      item.characterId === characterId &&
      Number(item.sceneNumber) === Number(sceneNumber)
  );
  if (found && Number.isFinite(found.x) && Number.isFinite(found.y)) {
    return { x: found.x, y: found.y };
  }
  return null;
}

// 沿点序列按进度（0~1）取点，线性段插值。
export function pointAtProgress(points, progress) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const p = clamp(progress, 0, 1);
  const seg = p * (points.length - 1);
  const index = Math.min(Math.floor(seg), points.length - 2);
  const k = seg - index;
  return {
    x: points[index].x + (points[index + 1].x - points[index].x) * k,
    y: points[index].y + (points[index + 1].y - points[index].y) * k,
  };
}
