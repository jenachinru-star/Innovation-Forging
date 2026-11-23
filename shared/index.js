function toStr(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}
function toStrArray(v) {
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function createEmptyScriptData() {
  return { summary: '', scenes: [], characters: [], relationships: [] };
}

export function normalizeScene(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    sceneNumber: toNum(r.sceneNumber),
    title: toStr(r.title),
    location: toStr(r.location),
    characters: toStrArray(r.characters),
    props: toStrArray(r.props),
    summary: toStr(r.summary),
    estimatedMinutes: toNum(r.estimatedMinutes),
  };
}

export function normalizeCharacter(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return { name: toStr(r.name), description: toStr(r.description) };
}

export function normalizeRelationship(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    from: toStr(r.from),
    to: toStr(r.to),
    relation: toStr(r.relation),
    needsReview: Boolean(r.needsReview),
  };
}

export function normalizeScriptData(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    summary: toStr(r.summary),
    scenes: Array.isArray(r.scenes) ? r.scenes.map(normalizeScene) : [],
    characters: Array.isArray(r.characters) ? r.characters.map(normalizeCharacter) : [],
    relationships: Array.isArray(r.relationships) ? r.relationships.map(normalizeRelationship) : [],
  };
}
