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

export function splitLines(text) {
  const normalized = String(text || '').replace(/\r\n?/g, '\n');
  if (normalized === '') return [];
  return normalized.split('\n');
}

// 基于 LCS 的行级 diff：返回 [{op:'equal'|'add'|'remove', text, oldIndex, newIndex}]
export function diffLines(oldText, newText) {
  const left = splitLines(oldText);
  const right = splitLines(newText);
  const m = left.length;
  const n = right.length;

  const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (left[i] === right[j]) table[i][j] = table[i + 1][j + 1] + 1;
      else table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (left[i] === right[j]) {
      ops.push({ op: 'equal', text: left[i], oldIndex: i, newIndex: j });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ op: 'remove', text: left[i], oldIndex: i, newIndex: -1 });
      i += 1;
    } else {
      ops.push({ op: 'add', text: right[j], oldIndex: -1, newIndex: j });
      j += 1;
    }
  }
  while (i < m) {
    ops.push({ op: 'remove', text: left[i], oldIndex: i, newIndex: -1 });
    i += 1;
  }
  while (j < n) {
    ops.push({ op: 'add', text: right[j], oldIndex: -1, newIndex: j });
    j += 1;
  }
  return ops;
}

// 把行级 ops 整理为左右对齐的双栏行：{op, left, right}
export function buildSplitRows(ops) {
  const rows = [];
  for (const entry of ops) {
    if (entry.op === 'equal') rows.push({ op: 'equal', left: entry.text, right: entry.text });
    else if (entry.op === 'remove') rows.push({ op: 'remove', left: entry.text, right: '' });
    else rows.push({ op: 'add', left: '', right: entry.text });
  }
  return rows;
}
