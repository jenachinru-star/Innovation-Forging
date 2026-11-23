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

export function findImpacts({ prevData, nextData, cues, briefs } = {}) {
  void prevData;
  const impacts = [];
  let seq = 0;
  const nextId = () => `imp-${++seq}`;

  const corpus = dataText(nextData);
  const cueList = asArray(cues);

  for (const cue of cueList) {
    if (!cue) continue;
    const quote = cue.trigger && typeof cue.trigger === 'object' ? cue.trigger.quote : '';
    const text = quote == null ? '' : String(quote);
    if (!text.trim()) continue;
    if (corpus.includes(text)) continue;

    impacts.push({
      id: nextId(),
      change: { kind: 'script', refId: cue.id, description: '绑定台词已不存在' },
      target: { kind: 'cue', refId: cue.id },
      reason: '该提示绑定的台词在新版剧本中已不存在',
      suggestion: '重新绑定到其他台词，或删除该提示',
      status: 'open',
    });
  }

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

  return impacts;
}
