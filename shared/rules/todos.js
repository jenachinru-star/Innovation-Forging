import { BRIEF_STATUS, IMPACT_STATUS } from '../constants/status.js';

/**
 * 从真实 plan 数据派生待办列表。
 * 每项 id 对应导航模块，点击可直达；无具体待办时给出兜底引导。
 *
 * @param {object} plan 作品 plan
 * @returns {Array<{id:string,label:string,meta:string}>}
 */
export function buildTodos(plan) {
  const source = plan && typeof plan === 'object' ? plan : {};
  const reviewBriefs = (Array.isArray(source.briefs) ? source.briefs : []).filter(
    (item) => item?.status === BRIEF_STATUS.NEEDS_REVIEW
  );
  const openImpacts = (Array.isArray(source.impacts) ? source.impacts : []).filter(
    (item) => item?.status === IMPACT_STATUS.OPEN
  );

  const todos = [];
  if (reviewBriefs.length) {
    todos.push({ id: 'briefs', label: '待核实部门需求', meta: '部门·需求' });
  }
  if (openImpacts.length) {
    todos.push({ id: 'rehearsal', label: '待处理排练影响', meta: '排练·影响' });
  }
  if (!source.style) {
    todos.push({ id: 'visuals', label: '确定视觉方向', meta: '视觉·风格' });
  }
  if (!todos.length) {
    todos.push({ id: 'stage', label: '确认走位与提示', meta: '舞台·调度' });
  }
  return todos;
}
