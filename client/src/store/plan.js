import { createEmptyProductionPlan } from '@director/shared';
import {
  BRIEF_STATUS,
  CUE_STATUS,
  IMPACT_STATUS,
  ASSET_STATUS,
  DISCUSSION_STATUS,
} from '@director/shared/constants/status.js';
import { assertStatusTransition } from '@director/shared/rules/statusFlow.js';
import { mergeStageSettings, normalizeRect } from '../stage/stageSettings.js';

// 状态流转守卫：非法状态跳转被静默拒绝（保留原值），合法跳转与自转放行。
function applyStatusGuard(kind, list, id, patch) {
  const patchObj = asObject(patch);
  const status = patchObj.status;
  if (status == null) return patchObj;
  const item = asArray(list).find((x) => x && x.id === id);
  const current = item ? item.status : undefined;
  const { ok } = assertStatusTransition(kind, current, status);
  if (ok) return patchObj;
  const { status: _dropped, ...rest } = patchObj;
  return rest;
}

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

function toSceneNumber(value) {
  if (value != null && value !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function normalizeStaging(staging) {
  const base = asObject(staging);
  return {
    stage: mergeStageSettings(base.stage),
    placements: asArray(base.placements),
    objects: asArray(base.objects),
    paths: asArray(base.paths),
    notes: asArray(base.notes),
  };
}

export function planReducer(state, action) {
  const current = state && typeof state === 'object' ? state : createEmptyProductionPlan('stage', '');
  const type = action && action.type;

  switch (type) {
    case 'renamePlan':
      return { ...current, name: String(action.name || '').trim() || '未命名作品' };

    case 'setStyle':
      return {
        ...current,
        style: action.style && typeof action.style === 'object' ? { ...action.style } : null,
      };

    case 'setAIConsent':
      return {
        ...current,
        aiConsent: {
          text: Boolean(action.value),
          authorizedAt: action.value ? new Date().toISOString() : null,
          mediaConfirmRequired: true,
        },
      };

    case 'setSourceVersion':
      return { ...current, sourceVersion: String(action.id || '') };

    case 'upsertAsset': {
      const assets = asArray(current.assets);
      const asset = asObject(action.asset);
      if (!asset.id) return current;
      const found = assets.some((item) => item?.id === asset.id);
      return {
        ...current,
        assets: found
          ? assets.map((item) => (item?.id === asset.id ? { ...item, ...asset } : item))
          : [...assets, asset],
      };
    }

    case 'markAssetsStale':
      return {
        ...current,
        assets: asArray(current.assets).map((asset) => ({
          ...asset,
          status: ASSET_STATUS.STALE,
          staleReason: String(action.reason || '上游剧本已修改'),
        })),
      };

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
            sceneNumber: toSceneNumber(cue.sceneNumber),
            anchor: cue.anchor || null,
            trigger: cue.trigger || { type: 'free', quote: '', offset: null },
            content: cue.content || '',
            status: cue.status || CUE_STATUS.DRAFT,
            note: cue.note || '',
          },
        ],
      };
    }

    case 'updateCue':
      return {
        ...current,
        cues: patchById(
          current.cues,
          action.id,
          applyStatusGuard('cue', current.cues, action.id, action.patch)
        ),
      };

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
            sceneNumber: toSceneNumber(brief.sceneNumber),
            cueId: brief.cueId ?? null,
            original: brief.original || '',
            items: asArray(brief.items),
            uncertain: asArray(brief.uncertain),
            priority: brief.priority || 'medium',
            dueDate: brief.dueDate ?? null,
            status: brief.status || BRIEF_STATUS.DRAFT,
            owner: brief.owner || '',
            note: brief.note || '',
          },
        ],
      };
    }

    case 'updateBrief':
      return {
        ...current,
        briefs: patchById(
          current.briefs,
          action.id,
          applyStatusGuard('brief', current.briefs, action.id, action.patch)
        ),
      };

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

    case 'addStageObject': {
      const staging = normalizeStaging(current.staging);
      const object = asObject(action.object);
      return {
        ...current,
        staging: {
          ...staging,
          objects: [
            ...staging.objects,
            {
              id: object.id || nextId('object', staging.objects),
              kind: object.kind || 'table',
              label: object.label || '道具',
              sceneNumber: toSceneNumber(object.sceneNumber),
              x: Number.isFinite(object.x) ? object.x : 400,
              y: Number.isFinite(object.y) ? object.y : 260,
              rotation: Number.isFinite(object.rotation) ? object.rotation : 0,
              scale: Number.isFinite(object.scale) ? object.scale : 1,
            },
          ],
        },
      };
    }

    case 'updateStageObject': {
      const staging = normalizeStaging(current.staging);
      return {
        ...current,
        staging: {
          ...staging,
          objects: staging.objects.map((object) =>
            object?.id === action.id ? { ...object, ...asObject(action.patch) } : object
          ),
        },
      };
    }

    case 'removeStageObject': {
      const staging = normalizeStaging(current.staging);
      return {
        ...current,
        staging: {
          ...staging,
          objects: staging.objects.filter((object) => object?.id !== action.id),
        },
      };
    }

    case 'updateStageSettings': {
      const staging = normalizeStaging(current.staging);
      const prev = staging.stage;
      const patch = asObject(action.patch);
      const next = { ...prev };

      if (patch.frame) next.frame = normalizeRect(patch.frame, prev.frame);

      if (patch.doors) {
        const doorPatch = asObject(patch.doors);
        next.doors = {
          up: doorPatch.up ? normalizeRect(doorPatch.up, prev.doors.up) : prev.doors.up,
          down: doorPatch.down ? normalizeRect(doorPatch.down, prev.doors.down) : prev.doors.down,
        };
      }

      if (patch.grid) {
        const gridPatch = asObject(patch.grid);
        const spacing = Number(gridPatch.spacing);
        next.grid = {
          showGrid:
            gridPatch.showGrid === undefined ? prev.grid.showGrid : gridPatch.showGrid === true,
          spacing: Number.isFinite(spacing) && spacing > 0 ? spacing : prev.grid.spacing,
        };
      }

      return { ...current, staging: { ...staging, stage: next } };
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
            item.status === IMPACT_STATUS.OPEN &&
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
            status: impact.status || IMPACT_STATUS.OPEN,
          },
        ],
      };
    }

    case 'resolveImpact':
      return {
        ...current,
        impacts: asArray(current.impacts).map((impact) => {
          if (!impact || impact.id !== action.id) return impact;
          const { ok } = assertStatusTransition('impact', impact.status, action.status);
          return ok ? { ...impact, status: action.status } : impact;
        }),
      };

    case 'addDiscussion': {
      const discussions = asArray(current.discussions);
      const discussion = asObject(action.discussion);
      return {
        ...current,
        discussions: [
          {
            id: discussion.id || nextId('disc', discussions),
            title: discussion.title || '未命名讨论',
            kind: discussion.kind || 'text',
            createdAt: discussion.createdAt || new Date().toISOString(),
            durationSec: Number.isFinite(discussion.durationSec) ? discussion.durationSec : 0,
            audioUrl: discussion.audioUrl || '',
            transcript: discussion.transcript || '',
            status: discussion.status || DISCUSSION_STATUS.DRAFT,
            summary: asObject(discussion.summary),
          },
          ...discussions,
        ],
      };
    }

    case 'updateDiscussion':
      return {
        ...current,
        discussions: patchById(current.discussions, action.id, action.patch),
      };

    case 'removeDiscussion':
      return {
        ...current,
        discussions: asArray(current.discussions).filter(
          (discussion) => !discussion || discussion.id !== action.id
        ),
      };

    case 'setReview': {
      const payload = asObject(action.payload);
      return {
        ...current,
        review: {
          goal: String(payload.goal ?? ''),
          wentWell: String(payload.wentWell ?? ''),
          improve: String(payload.improve ?? ''),
          nextActions: String(payload.nextActions ?? ''),
          conclusion: String(payload.conclusion ?? ''),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    case 'addCollection': {
      const collections = asArray(current.collections);
      const text = String(action.text ?? '').trim();
      if (!text) return current;
      return {
        ...current,
        collections: [
          {
            id: nextId('coll', collections),
            text,
            createdAt: new Date().toISOString(),
          },
          ...collections,
        ],
      };
    }

    case 'removeCollection':
      return {
        ...current,
        collections: asArray(current.collections).filter(
          (item) => !item || item.id !== action.id
        ),
      };

    default:
      return current;
  }
}
