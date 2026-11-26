import { describe, it, expect } from 'vitest';
import { SAMPLE_SCRIPT_DATA } from '@director/shared/samples/oneAct.js';
import {
  buildShots,
  buildCharacterArcs,
  buildConflicts,
  buildCalendarMatrix,
  buildCallSheet,
} from '@director/shared/rules/coreDesk.js';

describe('buildShots', () => {
  it('每场生成一个初始镜头并带台词与场景号', () => {
    const shots = buildShots(SAMPLE_SCRIPT_DATA);
    expect(shots).toHaveLength(3);
    expect(shots[0].sceneNumber).toBe(1);
    expect(shots[0].shotType).toBe('中景');
    expect(shots[0].dialogue).toBe('你终于回来了。');
  });

  it('空输入安全返回空数组', () => {
    expect(buildShots(null)).toEqual([]);
  });
});

describe('buildCharacterArcs', () => {
  it('每个角色一条弧光，节点只覆盖出场场次', () => {
    const arcs = buildCharacterArcs(SAMPLE_SCRIPT_DATA);
    expect(arcs).toHaveLength(3);
    const lan = arcs.find((a) => a.characterName === '老周');
    // 老周只在第二场出现
    expect(lan.beats).toHaveLength(1);
    expect(lan.beats[0].sceneNumber).toBe(2);
    expect(lan.beats[0].intensity).toBeGreaterThan(0);
    expect(lan.beats[0].intensity).toBeLessThanOrEqual(95);
  });
});

describe('buildConflicts', () => {
  it('示例无关系数据时返回空数组', () => {
    expect(buildConflicts(SAMPLE_SCRIPT_DATA)).toEqual([]);
  });
});

describe('buildCalendarMatrix', () => {
  it('返回 42 格且当月日期数量正确', () => {
    const matrix = buildCalendarMatrix(2025, 0); // 2025 年 1 月
    expect(matrix).toHaveLength(42);
    expect(matrix.filter((c) => c.inMonth)).toHaveLength(31);
    const first = matrix.find((c) => c.inMonth);
    expect(first.date).toBe('2025-01-01');
  });
});

describe('buildCallSheet', () => {
  it('选场返回在场人物与道具等通告信息', () => {
    const sheet = buildCallSheet(SAMPLE_SCRIPT_DATA, 1);
    expect(sheet.location).toBe('客厅');
    expect(sheet.characters).toContain('老陈');
    expect(sheet).toHaveProperty('call');
  });

  it('不存在的场次返回 null', () => {
    expect(buildCallSheet(SAMPLE_SCRIPT_DATA, 99)).toBeNull();
  });
});
