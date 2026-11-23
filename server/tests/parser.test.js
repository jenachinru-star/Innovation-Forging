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

  it('无结构文本给警告不抛错', () => {
    const { warnings } = parseScriptOffline('随便一段没有结构的文字');
    expect(Array.isArray(warnings)).toBe(true);
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
