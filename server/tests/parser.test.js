import { describe, it, expect } from 'vitest';
import { parseScriptOffline } from '@director/shared/parser/index.js';

const TEXT = `人物：老陈、阿岚

第一幕

第一场 老陈的客厅

（灯亮。老陈坐在桌边擦拭一把钥匙。）

老陈：你终于回来了。
阿岚：钥匙还在你这儿？
（阿岚伸手，老陈把钥匙递过去。）

第二场 门口

阿岚：我走了。`;

describe('parseScriptOffline', () => {
  it('识别幕、场与人物', () => {
    const { scriptData } = parseScriptOffline(TEXT);
    expect(scriptData.acts).toHaveLength(1);
    expect(scriptData.scenes).toHaveLength(2);
    expect(scriptData.scenes[0].location).toBe('老陈的客厅');
    expect(scriptData.scenes[0].characters).toEqual(['老陈', '阿岚']);
  });

  it('把台词结构化进当前场 lines', () => {
    const { scriptData } = parseScriptOffline(TEXT);
    expect(scriptData.scenes[0].lines).toEqual(
      expect.arrayContaining([expect.objectContaining({ speaker: '老陈', text: '你终于回来了。' })])
    );
    expect(scriptData.scenes[0].lines[0].offset).toBeGreaterThanOrEqual(0);
  });

  it('提取舞台说明与道具', () => {
    const { scriptData } = parseScriptOffline(TEXT);
    expect(scriptData.scenes[0].stageDirections.join('')).toContain('灯亮');
    expect(scriptData.scenes[0].props).toContain('钥匙');
  });

  it('记录原文范围', () => {
    const { scriptData } = parseScriptOffline(TEXT);
    const r = scriptData.scenes[0].rawRange;
    expect(TEXT.slice(r.start, r.end)).toContain('老陈的客厅');
  });

  it('无结构文本给出至少一条警告', () => {
    const { warnings } = parseScriptOffline('随便一段没有结构的文字');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('不把含中文标点的整句误判为台词角色', () => {
    const { scriptData } = parseScriptOffline('第一场 客厅\n\n老陈坐下，他说：我累了。');
    const names = scriptData.characters.map((c) => c.name);
    expect(names).not.toContain('老陈坐下，他说');
  });

  it('台词不误收单字道具，舞台说明仍识别道具', () => {
    const text = `第一场 客厅

（他拿起钥匙，又放下书）
老陈：你相信我吗？`;
    const { scriptData } = parseScriptOffline(text);
    const props = scriptData.scenes[0].props;
    expect(props).not.toContain('信');
    expect(props).toContain('钥匙');
    expect(props).toContain('书');
  });

  it('空输入、纯空白、单行文字都不抛错', () => {
    for (const input of ['', '   \n\t  ', '随便一段没有结构的文字']) {
      expect(() => parseScriptOffline(input)).not.toThrow();
      const { warnings, scriptData } = parseScriptOffline(input);
      expect(Array.isArray(warnings)).toBe(true);
      expect(scriptData.scenes).toEqual([]);
    }
  });

  it('meta 标注离线解析来源', () => {
    const { scriptData } = parseScriptOffline(TEXT);
    expect(scriptData.meta.source).toBe('upload');
    expect(scriptData.meta.parser).toBe('offline');
    expect(scriptData.meta.importedAt.length).toBeGreaterThan(0);
  });
});
