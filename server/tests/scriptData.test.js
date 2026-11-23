import { describe, it, expect } from 'vitest';
import {
  normalizeScriptData,
  createEmptyScriptData,
  normalizeScene,
  normalizeCharacter,
  normalizeRelationship,
  normalizeAct,
  createEmptyProductionPlan,
} from '@director/shared';

describe('normalizeScriptData', () => {
  it('null 返回空结构', () => {
    expect(normalizeScriptData(null)).toEqual(createEmptyScriptData());
  });

  it('强制转换字段与数组', () => {
    const out = normalizeScriptData({
      summary: 'x',
      scenes: [{
        sceneNumber: '2',
        location: '客厅',
        characters: '老王',
        props: null,
        estimatedMinutes: '5',
      }],
      characters: [{ name: '老王' }],
      relationships: [{ from: 'a', to: 'b', relation: 'friends', needsReview: 1 }],
    });
    expect(out.scenes[0].sceneNumber).toBe(2);
    expect(out.scenes[0].characters).toEqual(['老王']);
    expect(out.scenes[0].props).toEqual([]);
    expect(out.scenes[0].estimatedMinutes).toBe(5);
    expect(out.relationships[0].needsReview).toBe(true);
  });

  it('旧字段 summary/scenes/characters/relationships 行为不变', () => {
    const out = normalizeScriptData({
      summary: '概',
      scenes: [{ sceneNumber: 1 }],
      characters: [{ name: '老王' }],
      relationships: [{ from: 'a' }],
    });
    expect(out.summary).toBe('概');
    expect(out.scenes).toHaveLength(1);
    expect(out.characters[0].name).toBe('老王');
    expect(out.relationships[0].from).toBe('a');
  });
});

describe('ScriptData v2 缺省字段', () => {
  it('补齐 acts、meta 与场次新字段缺省值', () => {
    const out = normalizeScriptData({ scenes: [{ sceneNumber: 1 }] });
    expect(out.acts).toEqual([]);
    expect(out.meta).toEqual({ source: 'upload', importedAt: '', parser: 'offline' });
    expect(out.meta.parser).toBe('offline');
    expect(out.scenes[0].id).toBe('sc-1');
    expect(out.scenes[0].presentCharacters).toEqual([]);
    expect(out.scenes[0].stageDirections).toEqual([]);
    expect(out.scenes[0].rawRange).toBeNull();
    expect(out.scenes[0].actId).toBeNull();
  });

  it('acts 经 normalizeAct 归一化', () => {
    const out = normalizeScriptData({
      acts: [{ actNumber: '1', title: '第一幕', sceneIds: ['sc-1', ''] }],
    });
    expect(out.acts).toEqual([
      { id: '', actNumber: 1, title: '第一幕', sceneIds: ['sc-1'] },
    ]);
  });

  it('meta 已传入的合法字段保留，缺失字段补齐', () => {
    expect(
      normalizeScriptData({
        meta: { source: 'sample', importedAt: '2026-11-23', parser: 'ai' },
      }).meta
    ).toEqual({ source: 'sample', importedAt: '2026-11-23', parser: 'ai' });

    expect(normalizeScriptData({ meta: { source: 'sample' } }).meta).toEqual({
      source: 'sample',
      importedAt: '',
      parser: 'offline',
    });
  });
});

describe('normalizeScene', () => {
  it('归一化 presentCharacters、stageDirections、rawRange、actId', () => {
    const out = normalizeScene({
      sceneNumber: '3',
      presentCharacters: ['阿岚', ''],
      stageDirections: '灯亮',
      rawRange: { start: 10, end: 20 },
      actId: 'act-1',
    });
    expect(out.id).toBe('sc-3');
    expect(out.presentCharacters).toEqual(['阿岚']);
    expect(out.stageDirections).toEqual(['灯亮']);
    expect(out.rawRange).toEqual({ start: 10, end: 20 });
    expect(out.actId).toBe('act-1');
  });

  it('显式 id 优先于缺省规则', () => {
    expect(normalizeScene({ id: 'custom', sceneNumber: 1 }).id).toBe('custom');
  });

  it('rawRange 非法为 null', () => {
    expect(normalizeScene({ rawRange: { start: 20, end: 10 } }).rawRange).toBeNull();
    expect(normalizeScene({ rawRange: { start: 'a', end: 10 } }).rawRange).toBeNull();
    expect(normalizeScene({ rawRange: { start: 5 } }).rawRange).toBeNull();
    expect(normalizeScene({ rawRange: null }).rawRange).toBeNull();
  });
});

describe('normalizeCharacter', () => {
  it('补 id 与 aliases', () => {
    expect(normalizeCharacter({ name: '老陈' })).toEqual({
      id: 'ch-老陈',
      name: '老陈',
      description: '',
      aliases: [],
    });
  });

  it('显式 id 与 aliases 归一化', () => {
    const out = normalizeCharacter({
      id: 'ch-x',
      name: '老陈',
      aliases: ['陈哥', ''],
      description: '主角',
    });
    expect(out.id).toBe('ch-x');
    expect(out.aliases).toEqual(['陈哥']);
    expect(out.description).toBe('主角');
  });
});

describe('normalizeRelationship', () => {
  it('补 id 与 evidence', () => {
    const out = normalizeRelationship({
      from: 'a',
      to: 'b',
      relation: 'friends',
      evidence: { sceneId: 'sc-1', quote: '你好' },
    });
    expect(out).toEqual({
      id: '',
      from: 'a',
      to: 'b',
      relation: 'friends',
      needsReview: false,
      evidence: { sceneId: 'sc-1', quote: '你好' },
    });
  });

  it('evidence 缺省为 null', () => {
    expect(normalizeRelationship({}).evidence).toBeNull();
  });
});

describe('createEmptyProductionPlan', () => {
  it('返回空计划结构', () => {
    expect(createEmptyProductionPlan('stage', '排练')).toEqual({
      id: 'plan-1',
      type: 'stage',
      name: '排练',
      sourceVersion: '',
      segments: [],
      cues: [],
      briefs: [],
      staging: null,
      rehearsals: [],
      impacts: [],
    });
  });

  it('type/name 经 toStr 归一化', () => {
    const out = createEmptyProductionPlan(undefined, 123);
    expect(out.type).toBe('');
    expect(out.name).toBe('123');
  });
});
