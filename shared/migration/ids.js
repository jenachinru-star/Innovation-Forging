import { uid, isLegacyId } from '../id.js';

/**
 * 将旧的临时可读 id（sc-/ln-/ch-/act- 前缀或缺失）迁移为稳定 UUID。
 * 纯函数：不修改入参，返回新数据与旧 id→新 id 映射，供 plan 下游引用同步。
 * 幂等：已是 UUID 的记录原样保留，不重复生成。
 *
 * @param {object} scriptData 归一化后的剧本数据
 * @returns {{ data: object, maps: { scenes: object, characters: object, acts: object } }}
 */
export function migrateScriptDataIds(scriptData) {
  const source = scriptData && typeof scriptData === 'object' ? scriptData : {};
  const sceneMap = {};
  const characterMap = {};
  const actMap = {};

  const scenes = Array.isArray(source.scenes) ? source.scenes : [];
  const characters = Array.isArray(source.characters) ? source.characters : [];
  const acts = Array.isArray(source.acts) ? source.acts : [];
  const relationships = Array.isArray(source.relationships) ? source.relationships : [];

  const assignId = (item, map) => {
    const oldId = String(item.id || '');
    if (oldId && !isLegacyId(oldId)) return oldId;
    const newId = uid();
    if (oldId) map[oldId] = newId;
    return newId;
  };

  // 先为实体分配新 id 并建好映射，确保 scene.actId 等跨实体引用可解析
  const sceneIdOf = new Map(scenes.map((scene) => [scene, assignId(scene, sceneMap)]));
  const actIdOf = new Map(acts.map((act) => [act, assignId(act, actMap)]));
  const characterIdOf = new Map(
    characters.map((character) => [character, assignId(character, characterMap)])
  );

  const migratedScenes = scenes.map((scene) => {
    const lines = Array.isArray(scene.lines)
      ? scene.lines.map((line) => ({
          ...line,
          id: line.id && !isLegacyId(line.id) ? line.id : uid(),
        }))
      : [];
    return {
      ...scene,
      id: sceneIdOf.get(scene),
      lines,
      actId: scene.actId && actMap[scene.actId] ? actMap[scene.actId] : scene.actId || null,
    };
  });

  const migratedCharacters = characters.map((character) => ({
    ...character,
    id: characterIdOf.get(character),
  }));

  const migratedActs = acts.map((act) => ({
    ...act,
    id: actIdOf.get(act),
    sceneIds: (Array.isArray(act.sceneIds) ? act.sceneIds : []).map(
      (sceneId) => sceneMap[sceneId] || sceneId
    ),
  }));

  const migratedRelationships = relationships.map((relation) => ({
    ...relation,
    id: relation.id && !isLegacyId(relation.id) ? relation.id : uid(),
    evidence:
      relation.evidence && typeof relation.evidence === 'object'
        ? {
            ...relation.evidence,
            sceneId: sceneMap[relation.evidence.sceneId] || relation.evidence.sceneId || null,
          }
        : relation.evidence,
  }));

  return {
    data: {
      ...source,
      scenes: migratedScenes,
      characters: migratedCharacters,
      acts: migratedActs,
      relationships: migratedRelationships,
    },
    maps: { scenes: sceneMap, characters: characterMap, acts: actMap },
  };
}

/**
 * 按场景映射同步 plan 内引用旧场景 id 的字段。
 * 仅处理场景引用；角色在本阶段仍按名字关联，不在此替换。
 */
export function remapSceneReferences(plan, sceneMap) {
  if (!plan || typeof plan !== 'object') return plan;
  const remap = (refId) => (typeof refId === 'string' ? sceneMap[refId] || refId : refId);

  const cues = (Array.isArray(plan.cues) ? plan.cues : []).map((cue) => ({
    ...cue,
    sceneId: remap(cue.sceneId),
    anchor:
      cue.anchor && typeof cue.anchor === 'object'
        ? { ...cue.anchor, sceneId: remap(cue.anchor.sceneId) }
        : cue.anchor,
  }));

  const briefs = (Array.isArray(plan.briefs) ? plan.briefs : []).map((brief) => ({
    ...brief,
    sceneId: remap(brief.sceneId),
  }));

  const segments = (Array.isArray(plan.segments) ? plan.segments : []).map((segment) => ({
    ...segment,
    sceneIds: (Array.isArray(segment.sceneIds) ? segment.sceneIds : []).map(remap),
  }));

  const impacts = (Array.isArray(plan.impacts) ? plan.impacts : []).map((impact) => ({
    ...impact,
    target:
      impact.target && typeof impact.target === 'object' && impact.target.kind === 'scene'
        ? { ...impact.target, refId: remap(impact.target.refId) }
        : impact.target,
  }));

  return { ...plan, cues, briefs, segments, impacts };
}
