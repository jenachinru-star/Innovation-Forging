import { describe, it, expect } from 'vitest';
import {
  VIEW_W,
  VIEW_H,
  DEFAULT_Y,
  clamp,
  defaultPosition,
  storedPosition,
  pointAtProgress,
} from './geometry.js';

describe('geometry 常量', () => {
  it('逻辑画布尺寸与默认 Y 正确', () => {
    expect(VIEW_W).toBe(800);
    expect(VIEW_H).toBe(480);
    expect(DEFAULT_Y).toBe(298);
  });
});

describe('clamp', () => {
  it('区间内保持原值', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('越界收敛到边界', () => {
    expect(clamp(20, 0, 10)).toBe(10);
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('非有限值回退到最小值', () => {
    expect(clamp(NaN, 2, 10)).toBe(2);
  });
});

describe('defaultPosition', () => {
  it('按序均匀分布且 y 为默认值', () => {
    const p0 = defaultPosition(0, 2);
    const p1 = defaultPosition(1, 2);
    expect(p0.x).toBe(Math.round((VIEW_W * 1) / 3));
    expect(p1.x).toBe(Math.round((VIEW_W * 2) / 3));
    expect(p0.y).toBe(DEFAULT_Y);
  });
});

describe('storedPosition', () => {
  const placements = [
    { sceneNumber: 1, characterId: '阿珍', x: 111, y: 222 },
    { sceneNumber: 2, characterId: '阿珍', x: 333, y: 444 },
  ];

  it('命中对应场景与角色', () => {
    expect(storedPosition(placements, 1, '阿珍')).toEqual({ x: 111, y: 222 });
  });

  it('场景不匹配返回 null', () => {
    expect(storedPosition(placements, 9, '阿珍')).toBeNull();
  });

  it('非数组输入返回 null', () => {
    expect(storedPosition(undefined, 1, '阿珍')).toBeNull();
  });
});

describe('pointAtProgress', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 100, y: 200 },
  ];

  it('起点与终点', () => {
    expect(pointAtProgress(points, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAtProgress(points, 1)).toEqual({ x: 100, y: 200 });
  });

  it('中点线性插值', () => {
    expect(pointAtProgress(points, 0.5)).toEqual({ x: 50, y: 100 });
  });

  it('点不足或非法返回 null', () => {
    expect(pointAtProgress([{ x: 1, y: 1 }], 0.5)).toBeNull();
    expect(pointAtProgress(undefined, 0.5)).toBeNull();
  });
});
