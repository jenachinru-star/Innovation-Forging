import { describe, it, expect } from 'vitest';
import {
  applyKindAtCursor,
  countHeading,
  currentTokenAt,
  insertBlock,
  insertDialogue,
  lineRangeAt,
  suggestCharacters,
  toChineseNum,
  transformLine,
  unwrapLine,
} from './scriptEdit.js';

describe('toChineseNum', () => {
  it('转换常见数字', () => {
    expect(toChineseNum(1)).toBe('一');
    expect(toChineseNum(2)).toBe('二');
    expect(toChineseNum(10)).toBe('十');
    expect(toChineseNum(11)).toBe('十一');
    expect(toChineseNum(20)).toBe('二十');
  });
});

describe('unwrapLine', () => {
  it('拆解对白、说明与普通行', () => {
    expect(unwrapLine('老陈：你好')).toEqual({ speaker: '老陈', content: '你好' });
    expect(unwrapLine('（灯光暗下）')).toEqual({ speaker: '', content: '灯光暗下' });
    expect(unwrapLine('普通叙述')).toEqual({ speaker: '', content: '普通叙述' });
  });
});

describe('transformLine', () => {
  it('在类型间转换并保留内容', () => {
    expect(transformLine('你好', 'direction')).toBe('（你好）');
    expect(transformLine('老陈：你好', 'direction')).toBe('（你好）');
    expect(transformLine('你好', 'dialogue', { defaultSpeaker: '老陈' })).toBe('老陈：你好');
    expect(transformLine('你好', 'scene', { sceneNumber: 2 })).toBe('第二场 你好');
    expect(transformLine('你好', 'act', { actNumber: 1 })).toBe('第一幕');
  });
});

describe('lineRangeAt', () => {
  const doc = '第一行\n第二行\n第三行';
  it('定位光标所在行边界', () => {
    expect(lineRangeAt(doc, 0)).toEqual({ start: 0, end: 3 });
    expect(lineRangeAt(doc, 5)).toEqual({ start: 4, end: 7 });
    expect(lineRangeAt(doc, 20)).toEqual({ start: 8, end: 11 });
  });
});

describe('applyKindAtCursor', () => {
  it('转换光标所在行', () => {
    const r = applyKindAtCursor('a\n你好\nb', 3, 'direction');
    expect(r.text).toBe('a\n（你好）\nb');
  });
});

describe('insertBlock', () => {
  it('空文档不补换行，非空文档补换行', () => {
    expect(insertBlock('', 0, 0, '第一幕\n').text).toBe('第一幕\n');
    const r = insertBlock('abc', 3, 3, '第一幕\n');
    expect(r.text).toBe('abc\n第一幕\n');
  });

  it('文档第一行行首插入时，块后补换行，不与原行粘连', () => {
    const r = insertBlock('人物：老陈', 0, 0, '阿岚：');
    expect(r.text).toBe('阿岚：\n人物：老陈');
    expect(r.cursor).toBe(3);
  });

  it('非空行行首插入时，块独占一行', () => {
    const r = insertBlock('第一行\n第二行', 4, 4, '阿岚：');
    expect(r.text).toBe('第一行\n阿岚：\n第二行');
  });

  it('行中间插入时，块前后均补换行', () => {
    const r = insertBlock('第一行', 2, 2, '阿岚：');
    expect(r.text).toBe('第一\n阿岚：\n行');
  });

  it('空行插入时不产生多余空行', () => {
    expect(insertBlock('abc\n\ndef', 4, 4, '阿岚：').text).toBe('abc\n阿岚：\ndef');
  });
});

describe('insertDialogue', () => {
  it('插入角色对白前缀', () => {
    expect(insertDialogue('', 0, 0, '老陈').text).toBe('老陈：');
  });

  it('文档开头插入对白时独占一行', () => {
    expect(insertDialogue('人物：老陈、阿岚', 0, 0, '阿岚').text).toBe('阿岚：\n人物：老陈、阿岚');
  });
});

describe('currentTokenAt', () => {
  it('取正在输入的词，已有冒号则返回 null', () => {
    expect(currentTokenAt('老', 1).token).toBe('老');
    expect(currentTokenAt('老陈：你好', 4)).toBeNull();
  });
});

describe('suggestCharacters', () => {
  it('按包含关系过滤并限制数量', () => {
    expect(suggestCharacters('老', ['老陈', '老周', '阿岚'])).toEqual(['老陈', '老周']);
    expect(suggestCharacters('', ['老陈', '老周'])).toEqual(['老陈', '老周']);
  });
});

describe('countHeading', () => {
  it('统计幕/场行数', () => {
    expect(countHeading('第一幕\n第一幕', /^第[一二三四五六七八九十百\d]+幕/gm)).toBe(2);
  });
});
