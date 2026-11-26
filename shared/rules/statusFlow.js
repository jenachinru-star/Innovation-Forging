import { STATUS_FLOW } from '../constants/status.js';

/**
 * 状态流转强制（shared 纯函数，不依赖 DOM/服务端）。
 *
 * STATUS_FLOW 在 constants/status.js 中声明合法流转表，此前仅声明未在组件强制。
 * 本模块把声明落地为可复用校验，供 client reducer / UI 下拉 / server schema 复用。
 *
 * 规则：
 * - 自转（current === next）始终合法
 * - 未知 kind 不拦截（向后兼容未在表内的实体）
 * - 不在 flow[current] 允许列表中的 next 视为非法
 */
export function assertStatusTransition(kind, current, next) {
  const flow = STATUS_FLOW[kind];
  if (!flow) return { ok: true, error: null };
  if (current === next) return { ok: true, error: null };
  const allowed = flow[current];
  if (!Array.isArray(allowed)) return { ok: false, error: `未知状态：${current}` };
  if (allowed.includes(next)) return { ok: true, error: null };
  return { ok: false, error: `不允许从 ${current} 流转到 ${next}` };
}

/**
 * 返回某实体当前状态下可选的下一状态列表（含当前值本身），供下拉渲染。
 */
export function nextStatusOptions(kind, current) {
  const flow = STATUS_FLOW[kind];
  if (!flow) return [];
  const allowed = Array.isArray(flow[current]) ? flow[current] : [];
  return [current, ...allowed].filter(Boolean);
}