// 批次 B 过渡期 feature flag：旧 SVG 与 Konva 节点画布双跑对照。
// B7 对照一致后随旧 SVG 与开关一起删除。

export const KONVA_FLAG_KEY = 'kaipai.konvaCanvas';

export function readKonvaFlag() {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(KONVA_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeKonvaFlag(enabled) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KONVA_FLAG_KEY, enabled ? 'true' : 'false');
  } catch {
    // 隐私模式等场景下静默失败，仅内存态生效。
  }
}
