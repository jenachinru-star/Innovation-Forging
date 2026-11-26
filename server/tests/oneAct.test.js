import { describe, it, expect } from 'vitest';
import { SAMPLE_TEXT, SAMPLE_SCRIPT_DATA } from '@director/shared/samples/oneAct.js';
import { parseScriptOffline } from '@director/shared/parser/index.js';

const asText = (scene) => (scene.stageDirections || []).join('\n');

describe('oneAct sample', () => {
  it('正文包含关键道具「钥匙」与唯一台词「我把伞落在楼下了」', () => {
    expect(SAMPLE_TEXT).toContain('钥匙');
    const occurrences = SAMPLE_TEXT.split('我把伞落在楼下了').length - 1;
    expect(occurrences).toBe(1);
  });

  it('解析出三场，地点依次为客厅、门口、客厅', () => {
    expect(SAMPLE_SCRIPT_DATA.scenes).toHaveLength(3);
    expect(SAMPLE_SCRIPT_DATA.scenes.map((s) => s.location)).toEqual([
      '客厅',
      '门口',
      '客厅',
    ]);
  });

  it('解析出老陈、阿岚、老周三个角色', () => {
    const names = SAMPLE_SCRIPT_DATA.characters.map((c) => c.name);
    expect(names).toEqual(['老陈', '阿岚', '老周']);
  });

  it('存在非空的舞台说明', () => {
    const all = SAMPLE_SCRIPT_DATA.scenes.flatMap((s) => s.stageDirections);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((d) => d.length > 0)).toBe(true);
  });

  it('第一场含台词「你终于回来了」与灯光提示', () => {
    const first = SAMPLE_SCRIPT_DATA.scenes[0];
    expect(SAMPLE_TEXT.slice(first.rawRange.start, first.rawRange.end)).toContain(
      '你终于回来了',
    );
    expect(asText(first)).toContain('灯');
  });

  it('钥匙在场景内有交接的舞台说明', () => {
    const all = SAMPLE_SCRIPT_DATA.scenes.map(asText).join('\n');
    expect(all).toContain('钥匙');
    expect(all).toMatch(/钥匙/);
  });

  it('第二场 lines 含台词「我把伞落在楼下了。」', () => {
    const second = SAMPLE_SCRIPT_DATA.scenes[1];
    expect(second.lines.some((line) => line.text === '我把伞落在楼下了。')).toBe(true);
  });

  it('第二场含雨声音效提示', () => {
    const second = SAMPLE_SCRIPT_DATA.scenes[1];
    expect(asText(second)).toContain('雨声');
  });

  it('冒号写法的幕/场标题不会被误判为角色', () => {
    const text = '第一幕：启程\n第一场：特别节目\n老陈：你好\n第二场：雨中\n老陈：再见';
    const { scriptData } = parseScriptOffline(text);
    expect(scriptData.characters.map((c) => c.name)).toEqual(['老陈']);
    expect(scriptData.scenes).toHaveLength(2);
    expect(scriptData.scenes.map((s) => s.location)).toEqual(['特别节目', '雨中']);
  });
});
