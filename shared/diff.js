import { diffLines as jsDiffLines, diffWords as jsDiffWords } from 'diff';

function sceneKey(scene) {
  return scene?.id || scene?.title || '';
}

function characterKey(character) {
  return character?.id || character?.name || '';
}

export function diffScriptData(a, b) {
  const sa = a?.scenes || [];
  const sb = b?.scenes || [];
  const mapA = new Map(sa.map((s) => [sceneKey(s), s]));
  const mapB = new Map(sb.map((s) => [sceneKey(s), s]));

  const addedScenes = [];
  const removedScenes = [];
  const changedScenes = [];

  for (const [key, sb1] of mapB) {
    if (!mapA.has(key)) addedScenes.push(sb1.title || sb1.id || key);
  }
  for (const [key, sa1] of mapA) {
    if (!mapB.has(key)) removedScenes.push(sa1.title || sa1.id || key);
  }
  for (const [key, sa1] of mapA) {
    const sb1 = mapB.get(key);
    if (sb1 && sa1.summary !== sb1.summary) {
      changedScenes.push({ title: sa1.title || sb1.title || key, from: sa1.summary, to: sb1.summary });
    }
  }

  const ca = new Map((a?.characters || []).map((c) => [characterKey(c), c]));
  const cb = new Map((b?.characters || []).map((c) => [characterKey(c), c]));
  const characterDelta = {
    added: [...cb.keys()].filter((k) => !ca.has(k)).map((k) => cb.get(k).name || k),
    removed: [...ca.keys()].filter((k) => !cb.has(k)).map((k) => ca.get(k).name || k),
  };

  return { addedScenes, removedScenes, changedScenes, characterDelta };
}

export function splitLines(text) {
  const normalized = String(text || '').replace(/\r\n?/g, '\n');
  if (normalized === '') return [];
  return normalized.split('\n');
}

function normalize(text) {
  return String(text || '').replace(/\r\n?/g, '\n');
}

// 行级 diff：返回 [{op:'equal'|'add'|'remove', text, oldIndex, newIndex}]
export function diffLines(oldText, newText) {
  const chunks = jsDiffLines(normalize(oldText), normalize(newText));
  const ops = [];
  let oldIndex = 0;
  let newIndex = 0;

  for (const chunk of chunks) {
    const lines = String(chunk.value || '').split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    for (const text of lines) {
      if (chunk.removed) {
        ops.push({ op: 'remove', text, oldIndex, newIndex: -1 });
        oldIndex += 1;
      } else if (chunk.added) {
        ops.push({ op: 'add', text, oldIndex: -1, newIndex });
        newIndex += 1;
      } else {
        ops.push({ op: 'equal', text, oldIndex, newIndex });
        oldIndex += 1;
        newIndex += 1;
      }
    }
  }
  return ops;
}

// 词级 diff：返回 [{op:'equal'|'add'|'remove', text}]，供富文本高亮使用
export function diffWords(oldText, newText) {
  return jsDiffWords(normalize(oldText), normalize(newText)).map((chunk) => ({
    op: chunk.removed ? 'remove' : chunk.added ? 'add' : 'equal',
    text: chunk.value || '',
  }));
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
