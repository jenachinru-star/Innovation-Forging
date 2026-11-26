import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseScriptOffline } from '@director/shared/parser/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = readFileSync(join(here, 'fixtures/repair-shop.txt'), 'utf8');

describe('话剧舞台排版（真实 PDF 提取文本）', () => {
  const { scriptData, warnings } = parseScriptOffline(FIXTURE);

  it('识别全部七场', () => {
    expect(scriptData.scenes).toHaveLength(7);
    expect(scriptData.scenes.map((s) => s.sceneNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('识别九个具名角色，且林越与林月是两个不同角色', () => {
    const names = scriptData.characters.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining([
      '林越', '苏曼宁', '林守成', '阿满', '林月',
      '顾长顺', '马德宽', '方岚', '周淑琴',
    ]));
    expect(names).toContain('林越');
    expect(names).toContain('林月');
  });

  it('保留「众人」「五人齐」群演角色', () => {
    const names = scriptData.characters.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['众人', '五人齐']));
  });

  it('景行用破折号也能提取地点（第一场）', () => {
    const first = scriptData.scenes[0];
    expect(first.location).toContain('北京的家');
  });

  it('景行跨行时完整拼接地点（第六场）', () => {
    const sixth = scriptData.scenes.find((s) => s.sceneNumber === 6);
    expect(sixth.location).toContain('老旧的修理铺');
    expect(sixth.location).toContain('数只灯泡');
  });

  it('缺景标的五场给出补全警告，且不再误报候选表', () => {
    const missing = warnings.filter((w) => w.includes('未标注场景'));
    expect(missing).toHaveLength(5);
    expect(warnings.some((w) => w.includes('不在候选表'))).toBe(false);
  });

  it('剥离台词开头的语气括号并保留正文', () => {
    const first = scriptData.scenes[0];
    const line = first.lines[0];
    expect(line.speaker).toBe('林越');
    expect(line.text).not.toContain('刻意的轻快');
    expect(line.text.startsWith('苏老师')).toBe(true);
  });

  it('长台词跨行后续行拼接为完整一句', () => {
    const first = scriptData.scenes[0];
    const hit = first.lines.find((l) => l.text.includes('颜色调'));
    expect(hit.text).toContain('颜色调得那么腻');
  });

  it('动作行提示「不断说话」后，无角色名独白归到该角色（林越）', () => {
    const sixth = scriptData.scenes.find((s) => s.sceneNumber === 6);
    expect(sixth.lines[0].speaker).toBe('林越');
    expect(sixth.lines[0].text).toContain('三年级上学期');
  });

  it('括号不闭合的动作行也进入舞台说明', () => {
    const first = scriptData.scenes[0];
    expect(first.stageDirections.some((d) => d.startsWith('【') && !d.endsWith('】'))).toBe(true);
  });
});

describe('话剧排版精简内联文本', () => {
  const text = [
    '第二场',
    '顾长顺   九点半。',
    '（林越落座）',
    '林   月   （轻声）我来拿八音盒。',
    '林   月   它的盖子上有一道裂纹，',
    '我上周送来的。',
  ].join('\n');
  const { scriptData, warnings } = parseScriptOffline(text);

  it('无幕也能识别场次，角色名内部空格被归一', () => {
    expect(scriptData.scenes).toHaveLength(1);
    const names = scriptData.characters.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['顾长顺', '林月']));
    expect(names).not.toContain('林   月');
  });

  it('续行并入上一条台词', () => {
    const line = scriptData.scenes[0].lines.find((l) => l.speaker === '林月' && l.text.includes('裂纹'));
    expect(line.text).toContain('我上周送来的');
  });

  it('缺景标给出警告', () => {
    expect(warnings.some((w) => w.includes('未标注场景'))).toBe(true);
  });
});
