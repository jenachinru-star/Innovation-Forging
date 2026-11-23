import { createEmptyProductionPlan } from '@director/shared';

export function createPlan(type, name) {
  return createEmptyProductionPlan(type, name);
}

export function nextId(prefix, list) {
  const items = Array.isArray(list) ? list : [];
  const used = new Set(items.map((item) => item && item.id).filter(Boolean));
  let max = 0;
  for (const id of used) {
    const match = String(id).match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  let seq = max + 1;
  while (used.has(`${prefix}-${seq}`)) seq += 1;
  return `${prefix}-${seq}`;
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function patchById(list, id, patch) {
  return asArray(list).map((item) => (item && item.id === id ? { ...item, ...asObject(patch) } : item));
}

function toSceneNumber(value, fallbackId) {
  if (value != null && value !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  const match = fallbackId == null ? null : String(fallbackId).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function normalizeStaging(staging) {
  const base = asObject(staging);
  return {
    stage: base.stage ?? null,
    placements: asArray(base.placements),
    paths: asArray(base.paths),
    notes: asArray(base.notes),
  };
}

export function planReducer(state, action) {
  const current = state && typeof state === 'object' ? state : createEmptyProductionPlan('stage', '');
  const type = action && action.type;

  switch (type) {
    case 'addSegment': {
      const segments = asArray(current.segments);
      const segment = asObject(action.segment);
      return {
        ...current,
        segments: [
          ...segments,
          {
            id: segment.id || nextId('segment', segments),
            title: segment.title || '',
            sceneIds: asArray(segment.sceneIds),
            rawRange: segment.rawRange ?? null,
            castIds: asArray(segment.castIds),
            goals: asArray(segment.goals),
          },
        ],
      };
    }

    case 'updateSegment':
      return { ...current, segments: patchById(current.segments, action.id, action.patch) };

    case 'addCue': {
      const cues = asArray(current.cues);
      const cue = asObject(action.cue);
      const sceneId = cue.sceneId || '';
      return {
        ...current,
        cues: [
          ...cues,
          {
            id: cue.id || nextId('cue', cues),
            department: cue.department || 'lighting',
            sceneId,
            sceneNumber: toSceneNumber(cue.sceneNumber, sceneId),
            trigger: cue.trigger || { type: 'free', quote: '', offset: null },
            content: cue.content || '',
            status: cue.status || 'draft',
            note: cue.note || '',
          },
        ],
      };
    }

    case 'updateCue':
      return { ...current, cues: patchById(current.cues, action.id, action.patch) };

    case 'removeCue': {
      const cues = asArray(current.cues).filter((cue) => !cue || cue.id !== action.id);
      const briefs = asArray(current.briefs).map((brief) =>
        brief && brief.cueId === action.id ? { ...brief, cueId: null } : brief
      );
      return { ...current, cues, briefs };
    }

    case 'addBrief': {
      const briefs = asArray(current.briefs);
      const brief = asObject(action.brief);
      const sceneId = brief.sceneId || '';
      return {
        ...current,
        briefs: [
          ...briefs,
          {
            id: brief.id || nextId('brief', briefs),
            department: brief.department || 'lighting',
            sceneId,
            sceneNumber: toSceneNumber(brief.sceneNumber, sceneId),
            cueId: brief.cueId ?? null,
            original: brief.original || '',
            items: asArray(brief.items),
            uncertain: asArray(brief.uncertain),
            priority: brief.priority || 'medium',
            dueDate: brief.dueDate ?? null,
            status: brief.status || 'draft',
            owner: brief.owner || '',
            note: brief.note || '',
          },
        ],
      };
    }

    case 'updateBrief':
      return { ...current, briefs: patchById(current.briefs, action.id, action.patch) };

    case 'setPlacement': {
      const staging = normalizeStaging(current.staging);
      const placement = asObject(action.placement);
      const placements = staging.placements.filter(
        (item) =>
          !(
            item &&
            item.sceneNumber === placement.sceneNumber &&
            item.characterId === placement.characterId
          )
      );
      return {
        ...current,
        staging: { ...staging, placements: [...placements, placement] },
      };
    }

    case 'addPath': {
      const staging = normalizeStaging(current.staging);
      const path = asObject(action.path);
      return {
        ...current,
        staging: {
          ...staging,
          paths: [...staging.paths, { ...path, id: path.id || nextId('path', staging.paths) }],
        },
      };
    }

    case 'addRehearsal': {
      const rehearsals = asArray(current.rehearsals);
      const rehearsal = asObject(action.rehearsal);
      return {
        ...current,
        rehearsals: [
          ...rehearsals,
          {
            id: rehearsal.id || nextId('rehearsal', rehearsals),
            segmentId: rehearsal.segmentId || '',
            date: rehearsal.date || '',
            location: rehearsal.location || '',
            castIds: asArray(rehearsal.castIds),
            notes: asArray(rehearsal.notes),
            decisions: asArray(rehearsal.decisions),
            openQuestions: asArray(rehearsal.openQuestions),
            todos: asArray(rehearsal.todos),
          },
        ],
      };
    }

    case 'updateRehearsal':
      return {
        ...current,
        rehearsals: patchById(current.rehearsals, action.id, action.patch),
      };

    case 'setRehearsalNotes': {
      const rehearsals = asArray(current.rehearsals);
      const payload = asObject(action.payload);
      const base = rehearsals.length > 0 && rehearsals[0] ? rehearsals[0] : {};
      return {
        ...current,
        rehearsals: [
          {
            id: base.id || 'reh-1',
            segmentId: base.segmentId || '',
            date: base.date || '',
            location: base.location || '',
            castIds: asArray(base.castIds),
            notes: payload.notes ?? base.notes ?? '',
            decisions: asArray(payload.decisions),
            openQuestions: asArray(payload.openQuestions),
            todos: asArray(payload.todos),
          },
          ...rehearsals.slice(1),
        ],
      };
    }

    case 'addImpact': {
      const impacts = asArray(current.impacts);
      const impact = asObject(action.impact);
      const target = impact.target || null;
      if (target && typeof target === 'object') {
        const duplicate = impacts.some(
          (item) =>
            item &&
            item.status === 'open' &&
            item.target &&
            item.target.kind === target.kind &&
            item.target.refId === target.refId
        );
        if (duplicate) return current;
      }
      const usedIds = new Set(impacts.map((item) => item && item.id).filter(Boolean));
      let id = impact.id || nextId('impact', impacts);
      if (usedIds.has(id)) {
        id = nextId('imp', impacts);
      }
      return {
        ...current,
        impacts: [
          ...impacts,
          {
            id,
            change: impact.change || null,
            target,
            reason: impact.reason || '',
            suggestion: impact.suggestion || '',
            status: impact.status || 'open',
          },
        ],
      };
    }

    case 'resolveImpact':
      return {
        ...current,
        impacts: asArray(current.impacts).map((impact) =>
          impact && impact.id === action.id ? { ...impact, status: action.status } : impact
        ),
      };

    default:
      return current;
  }
}
