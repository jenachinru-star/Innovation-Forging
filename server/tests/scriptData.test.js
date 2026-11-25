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
    expect(typeof out.scenes[0].id).toBe('string');
    expect(out.scenes[0].id).toBeTruthy();
    expect(out.scenes[0].presentCharacters).toEqual([]);
    expect(out.scenes[0].stageDirections).toEqual([]);
    expect(out.scenes[0].rawRange).toBeNull();
    expect(out.scenes[0].actId).toBeNull();
  });

  it('acts 经 normalizeAct 归一化', () => {
    const out = normalizeScriptData({
      acts: [{ actNumber: '1', title: '第一幕', sceneIds: ['sc-1', ''] }],
    });
    expect(out.acts[0].actNumber).toBe(1);
    expect(out.acts[0].title).toBe('第一幕');
    expect(out.acts[0].sceneIds).toEqual(['sc-1']);
    expect(typeof out.acts[0].id).toBe('string');
    expect(out.acts[0].id).toBeTruthy();
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
  it('保留节奏视图写入的 structure 结构标签', () => {
    expect(normalizeScene({ sceneNumber: 1, structure: '高潮' }).structure).toBe('高潮');
    expect(normalizeScene({ sceneNumber: 1 }).structure).toBe('');
  });

  it('归一化 presentCharacters、stageDirections、rawRange、actId', () => {
    const out = normalizeScene({
      sceneNumber: '3',
      presentCharacters: ['阿岚', ''],
      stageDirections: '灯亮',
      rawRange: { start: 10, end: 20 },
      actId: 'act-1',
    });
    expect(typeof out.id).toBe('string');
    expect(out.id).toBeTruthy();
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

  it('lines 归一化为 { id, speaker, text, offset }', () => {
    const out = normalizeScene({
      sceneNumber: 1,
      lines: [
        { speaker: '老陈', text: '你终于回来了。' },
        { speaker: '阿岚', text: '爸，我回来了。', offset: 42 },
        { speaker: '阿岚', text: '无偏移', offset: 'x' },
      ],
    });
    expect(out.lines.map((l) => l.speaker)).toEqual(['老陈', '阿岚', '阿岚']);
    expect(out.lines.map((l) => l.text)).toEqual(['你终于回来了。', '爸，我回来了。', '无偏移']);
    expect(out.lines.map((l) => l.offset)).toEqual([null, 42, null]);
    const lineIds = out.lines.map((l) => l.id);
    expect(lineIds.every((id) => typeof id === 'string' && id)).toBe(true);
    expect(new Set(lineIds).size).toBe(3);
  });

  it('lines 缺省为空数组，不抛错', () => {
    expect(normalizeScene({ sceneNumber: 1 }).lines).toEqual([]);
    expect(normalizeScene({ sceneNumber: 1, lines: null }).lines).toEqual([]);
  });
});

describe('normalizeCharacter', () => {
  it('补 id 与 aliases', () => {
    const character = normalizeCharacter({ name: '老陈' });
    expect(character.name).toBe('老陈');
    expect(character.description).toBe('');
    expect(character.aliases).toEqual([]);
    expect(typeof character.id).toBe('string');
    expect(character.id).toBeTruthy();
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
    expect(out.from).toBe('a');
    expect(out.to).toBe('b');
    expect(out.relation).toBe('friends');
    expect(out.needsReview).toBe(false);
    expect(out.evidence).toEqual({ sceneId: 'sc-1', quote: '你好' });
    expect(typeof out.id).toBe('string');
    expect(out.id).toBeTruthy();
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
