import { describe, it, expect } from 'vitest';
import {
  migrateScriptDataIds,
  remapSceneReferences,
} from '@director/shared/migration/ids.js';

function legacyData() {
  return {
    scenes: [
      {
        id: 'sc-1',
        sceneNumber: 1,
        title: '第一场',
        actId: 'act-1',
        lines: [{ id: 'ln-1', speaker: '老陈', text: '你好', offset: null }],
      },
      { id: 'sc-2', sceneNumber: 2, title: '第二场', actId: 'act-1', lines: [] },
    ],
    characters: [{ id: 'ch-老陈', name: '老陈', description: '', aliases: [] }],
    acts: [{ id: 'act-1', actNumber: 1, title: '第一幕', sceneIds: ['sc-1', 'sc-2'] }],
    relationships: [
      {
        id: '',
        from: '老陈',
        to: '阿岚',
        relation: 'friends',
        needsReview: false,
        evidence: { sceneId: 'sc-1', quote: '你好' },
      },
    ],
  };
}

describe('migrateScriptDataIds', () => {
  it('旧前缀与空 id 迁移为 UUID，并建立旧→新映射', () => {
    const { data, maps } = migrateScriptDataIds(legacyData());

    expect(data.scenes[0].id).not.toBe('sc-1');
    expect(data.scenes[1].id).not.toBe('sc-2');
    expect(maps.scenes['sc-1']).toBe(data.scenes[0].id);
    expect(maps.scenes['sc-2']).toBe(data.scenes[1].id);

    expect(data.scenes[0].lines[0].id).not.toBe('ln-1');
    expect(data.characters[0].id).not.toBe('ch-老陈');
    expect(maps.characters['ch-老陈']).toBe(data.characters[0].id);

    expect(data.acts[0].id).not.toBe('act-1');
    expect(maps.acts['act-1']).toBe(data.acts[0].id);

    expect(data.relationships[0].id).toBeTruthy();
  });

  it('同步 act.sceneIds、scene.actId 与 relationship.evidence.sceneId', () => {
    const { data, maps } = migrateScriptDataIds(legacyData());

    expect(data.acts[0].sceneIds).toEqual([maps.scenes['sc-1'], maps.scenes['sc-2']]);
    expect(data.scenes[0].actId).toBe(maps.acts['act-1']);
    expect(data.scenes[1].actId).toBe(maps.acts['act-1']);
    expect(data.relationships[0].evidence.sceneId).toBe(maps.scenes['sc-1']);
  });

  it('幂等：已是 UUID 的记录不重复生成，二次迁移 id 不变', () => {
    const first = migrateScriptDataIds(legacyData());
    const second = migrateScriptDataIds(first.data);

    expect(second.data.scenes[0].id).toBe(first.data.scenes[0].id);
    expect(second.data.characters[0].id).toBe(first.data.characters[0].id);
    expect(second.data.acts[0].id).toBe(first.data.acts[0].id);
    expect(second.data.acts[0].sceneIds).toEqual(first.data.acts[0].sceneIds);
  });

  it('空输入不抛错并返回空结构', () => {
    const { data } = migrateScriptDataIds(null);
    expect(data.scenes).toEqual([]);
    expect(data.characters).toEqual([]);
    expect(data.acts).toEqual([]);
    expect(data.relationships).toEqual([]);
  });
});

describe('remapSceneReferences', () => {
  it('同步 cue/brief/segment/impact 中的场景引用', () => {
    const { maps } = migrateScriptDataIds(legacyData());
    const plan = {
      cues: [
        { sceneId: 'sc-1', anchor: { kind: 'scene', sceneId: 'sc-1', quote: '' } },
      ],
      briefs: [{ sceneId: 'sc-2' }],
      segments: [{ sceneIds: ['sc-1', 'sc-2'] }],
      impacts: [{ target: { kind: 'scene', refId: 'sc-2' } }],
    };

    const next = remapSceneReferences(plan, maps.scenes);
    expect(next.cues[0].sceneId).toBe(maps.scenes['sc-1']);
    expect(next.cues[0].anchor.sceneId).toBe(maps.scenes['sc-1']);
    expect(next.briefs[0].sceneId).toBe(maps.scenes['sc-2']);
    expect(next.segments[0].sceneIds).toEqual([maps.scenes['sc-1'], maps.scenes['sc-2']]);
    expect(next.impacts[0].target.refId).toBe(maps.scenes['sc-2']);
  });

  it('未知引用原样保留，非 scene 类型 impact.target 不改动', () => {
    const plan = {
      cues: [],
      briefs: [],
      segments: [],
      impacts: [{ target: { kind: 'character', refId: 'ch-老陈' } }],
    };
    const next = remapSceneReferences(plan, { 'sc-1': 'uuid-x' });
    expect(next.impacts[0].target.refId).toBe('ch-老陈');
  });
});
