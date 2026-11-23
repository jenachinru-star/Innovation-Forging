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

function normalizeRawRange(v) {
  const r = v && typeof v === 'object' ? v : null;
  if (!r) return null;
  const { start, end } = r;
  if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
    return { start, end };
  }
  return null;
}

function normalizeEvidence(v) {
  const e = v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  if (!e) return null;
  return { sceneId: toStr(e.sceneId), quote: toStr(e.quote) };
}

function normalizeMeta(raw) {
  const m = raw && typeof raw === 'object' ? raw : {};
  return {
    source: toStr(m.source) || 'upload',
    importedAt: toStr(m.importedAt),
    parser: toStr(m.parser) || 'offline',
  };
}

export function createEmptyScriptData() {
  return {
    summary: '',
    scenes: [],
    characters: [],
    relationships: [],
    acts: [],
    meta: { source: 'upload', importedAt: '', parser: 'offline' },
  };
}

export function normalizeScene(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const sceneNumber = toNum(r.sceneNumber);
  return {
    id: toStr(r.id) || `sc-${sceneNumber}`,
    sceneNumber,
    title: toStr(r.title),
    location: toStr(r.location),
    characters: toStrArray(r.characters),
    presentCharacters: toStrArray(r.presentCharacters),
    props: toStrArray(r.props),
    stageDirections: toStrArray(r.stageDirections),
    summary: toStr(r.summary),
    estimatedMinutes: toNum(r.estimatedMinutes),
    rawRange: normalizeRawRange(r.rawRange),
    actId: toStr(r.actId) || null,
    structure: toStr(r.structure),
  };
}

export function normalizeCharacter(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const name = toStr(r.name);
  return {
    id: toStr(r.id) || `ch-${name}`,
    name,
    description: toStr(r.description),
    aliases: toStrArray(r.aliases),
  };
}

export function normalizeRelationship(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    id: toStr(r.id),
    from: toStr(r.from),
    to: toStr(r.to),
    relation: toStr(r.relation),
    needsReview: Boolean(r.needsReview),
    evidence: normalizeEvidence(r.evidence),
  };
}

export function normalizeAct(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    id: toStr(r.id),
    actNumber: toNum(r.actNumber),
    title: toStr(r.title),
    sceneIds: toStrArray(r.sceneIds),
  };
}

export function normalizeScriptData(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    summary: toStr(r.summary),
    scenes: Array.isArray(r.scenes) ? r.scenes.map(normalizeScene) : [],
    characters: Array.isArray(r.characters) ? r.characters.map(normalizeCharacter) : [],
    relationships: Array.isArray(r.relationships) ? r.relationships.map(normalizeRelationship) : [],
    acts: Array.isArray(r.acts) ? r.acts.map(normalizeAct) : [],
    meta: normalizeMeta(r.meta),
  };
}

export function createEmptyProductionPlan(type, name) {
  return {
    id: 'plan-1',
    type: toStr(type),
    name: toStr(name),
    sourceVersion: '',
    segments: [],
    cues: [],
    briefs: [],
    staging: null,
    rehearsals: [],
    impacts: [],
  };
}
