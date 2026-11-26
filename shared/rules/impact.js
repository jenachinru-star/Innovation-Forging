function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sceneText(scene) {
  if (!scene || typeof scene !== 'object') return '';
  const lines = asArray(scene.lines).map((line) =>
    line && typeof line === 'object' ? String(line.text ?? '') : String(line ?? '')
  );
  const directions = asArray(scene.stageDirections).map((direction) => String(direction ?? ''));
  return [...lines, ...directions].join('\n');
}

function dataText(data) {
  return asArray(data?.scenes).map(sceneText).join('\n');
}

// 场次稳定标识：优先 sceneNumber，退化为 title。用于 prev→next diff。
function sceneKey(scene) {
  if (!scene || typeof scene !== 'object') return '';
  const num = scene.sceneNumber;
  if (num != null && Number.isFinite(Number(num))) return `num:${Number(num)}`;
  return `title:${String(scene.title || '')}`;
}

function sceneSet(data) {
  return new Set(asArray(data?.scenes).map(sceneKey).filter(Boolean));
}

/**
 * 剧本版本变更影响分析：真正对比 prevData → nextData。
 *
 * 检测四类影响（均为 open 状态）：
 * 1. cue 绑定台词在 nextData 中已不存在
 * 2. cue 关联的场次在 nextData 中已删除（prev 有、next 无）
 * 3. brief 关联的 cue 在 cues 中已不存在
 * 4. brief 关联的场次在 nextData 中已删除
 *
 * id 保持 imp-N 序列，与既有持久化数据兼容。
 */
export function findImpacts({ prevData, nextData, cues, briefs } = {}) {
  const impacts = [];
  let seq = 0;
  const nextId = () => `imp-${++seq}`;

  const prevScenes = sceneSet(prevData);
  const nextScenes = sceneSet(nextData);
  const nextCorpus = dataText(nextData);
  const cueList = asArray(cues);

  // 1) cue 绑定台词在下一版中消失
  for (const cue of cueList) {
    if (!cue) continue;
    const quote = cue.trigger && typeof cue.trigger === 'object' ? cue.trigger.quote : '';
    const text = quote == null ? '' : String(quote);
    if (!text.trim()) continue;
    if (nextCorpus.includes(text)) continue;

    impacts.push({
      id: nextId(),
      change: { kind: 'script', refId: cue.id, description: '绑定台词已不存在' },
      target: { kind: 'cue', refId: cue.id },
      reason: '该提示绑定的台词在新版剧本中已不存在',
      suggestion: '重新绑定到其他台词，或删除该提示',
      status: 'open',
    });
  }

  // 2) cue 关联的场次在下一版中被删除
  for (const cue of cueList) {
    if (!cue) continue;
    const sceneNum = cue.sceneNumber;
    if (sceneNum == null) continue;
    const key = `num:${Number(sceneNum)}`;
    if (prevScenes.has(key) && !nextScenes.has(key)) {
      impacts.push({
        id: nextId(),
        change: { kind: 'script', refId: cue.id, description: '关联场次已删除' },
        target: { kind: 'cue', refId: cue.id },
        reason: '该提示关联的场次在新版剧本中已删除',
        suggestion: '重新关联到其他场次，或删除该提示',
        status: 'open',
      });
    }
  }

  // 3) brief 关联的 cue 已不存在
  const cueIds = new Set(cueList.filter(Boolean).map((cue) => cue.id));
  for (const brief of asArray(briefs)) {
    if (!brief || !brief.cueId) continue;
    if (cueIds.has(brief.cueId)) continue;

    impacts.push({
      id: nextId(),
      change: { kind: 'cue', refId: brief.cueId, description: '关联提示已不存在' },
      target: { kind: 'brief', refId: brief.id },
      reason: '该需求关联的提示在新版方案中已不存在',
      suggestion: '重新关联提示，或更新该需求',
      status: 'open',
    });
  }

  // 4) brief 关联的场次在下一版中被删除
  for (const brief of asArray(briefs)) {
    if (!brief) continue;
    const sceneNum = brief.sceneNumber;
    if (sceneNum == null) continue;
    const key = `num:${Number(sceneNum)}`;
    if (prevScenes.has(key) && !nextScenes.has(key)) {
      impacts.push({
        id: nextId(),
        change: { kind: 'script', refId: brief.id, description: '关联场次已删除' },
        target: { kind: 'brief', refId: brief.id },
        reason: '该需求关联的场次在新版剧本中已删除',
        suggestion: '重新关联到其他场次，或更新该需求',
        status: 'open',
      });
    }
  }

  return impacts;
}
