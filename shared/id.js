/**
 * 稳定 id 生成器（浏览器与 Node 通用，纯函数，不依赖 DOM）。
 * 优先使用原生 crypto.randomUUID；不可用时回退到时间戳 + 随机串。
 */
export function uid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}

/** 旧格式前缀（sc-/ln-/ch-/act-），用于判断是否需要迁移到 UUID */
const LEGACY_PREFIXES = ['sc-', 'ln-', 'ch-', 'act-'];

/** 判断 id 是否为旧的可读临时格式（非 UUID、非空） */
export function isLegacyId(id) {
  const value = String(id || '');
  if (!value) return true;
  return LEGACY_PREFIXES.some((prefix) => value.startsWith(prefix));
}
