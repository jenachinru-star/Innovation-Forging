export function diffScriptData(a, b) {
  const sa = a?.scenes || [];
  const sb = b?.scenes || [];
  const mapA = new Map(sa.map((s) => [s.title, s]));
  const mapB = new Map(sb.map((s) => [s.title, s]));

  const addedScenes = [...mapB.keys()].filter((t) => !mapA.has(t));
  const removedScenes = [...mapA.keys()].filter((t) => !mapB.has(t));
  const changedScenes = [];
  for (const [title, sa1] of mapA) {
    const sb1 = mapB.get(title);
    if (sb1 && sa1.summary !== sb1.summary) {
      changedScenes.push({ title, from: sa1.summary, to: sb1.summary });
    }
  }

  const ca = new Set((a?.characters || []).map((c) => c.name));
  const cb = new Set((b?.characters || []).map((c) => c.name));
  return {
    addedScenes,
    removedScenes,
    changedScenes,
    characterDelta: {
      added: [...cb].filter((n) => !ca.has(n)),
      removed: [...ca].filter((n) => !cb.has(n)),
    },
  };
}
