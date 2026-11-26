// 旧部门名归一化：音乐（music）与音响（sound）合并为音乐音响（musicSound）
function normalizeDepartment(department) {
  if (department === 'music' || department === 'sound') return 'musicSound';
  return department || 'lighting';
}

/**
 * 对加载的作品 plan 做一次性结构迁移。
 * 纯函数：不修改入参；幂等，可安全重复执行。
 *
 * @param {object} plan 归一化前的作品 plan
 * @returns {object} 迁移后的 plan
 */
export function migratePlan(plan) {
  if (!plan || typeof plan !== 'object') return plan;

  const cues = Array.isArray(plan.cues)
    ? plan.cues.map((cue) =>
        cue ? { ...cue, department: normalizeDepartment(cue.department) } : cue
      )
    : plan.cues;

  const briefs = Array.isArray(plan.briefs)
    ? plan.briefs.map((brief) =>
        brief ? { ...brief, department: normalizeDepartment(brief.department) } : brief
      )
    : plan.briefs;

  return { ...plan, cues, briefs };
}
