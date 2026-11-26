import { describe, it, expect } from 'vitest';
import {
  selectAssets,
  countByType,
  assetTypeLabel,
  isVideoAsset,
} from '@director/shared/rules/assets.js';

const assets = [
  { id: 'a1', type: 'character', characterName: '阿珍', url: 'u1' },
  { id: 'a2', type: 'scene', title: '老戏台', url: 'u2', prompt: '黄昏暖光' },
  { id: 'a3', type: 'image', title: '助手草图', url: 'u3', source: 'assistant' },
  { id: 'a4', type: 'video', title: '镜头', url: 'u4' },
  { id: 'a5', type: 'prop', title: '旧钥匙' }, // 无 url，应被过滤
];

describe('selectAssets', () => {
  it('默认只保留含 url 的资产', () => {
    const result = selectAssets(assets);
    expect(result.map((a) => a.id)).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('按类型筛选', () => {
    expect(selectAssets(assets, { type: 'character' }).map((a) => a.id)).toEqual(['a1']);
  });

  it('按关键字匹配标题、人物名与提示词', () => {
    expect(selectAssets(assets, { keyword: '阿珍' }).map((a) => a.id)).toEqual(['a1']);
    expect(selectAssets(assets, { keyword: '暖光' }).map((a) => a.id)).toEqual(['a2']);
  });

  it('空输入安全返回空数组', () => {
    expect(selectAssets(null)).toEqual([]);
  });
});

describe('countByType', () => {
  it('统计全部与各类型数量', () => {
    const counts = countByType(assets);
    expect(counts.all).toBe(4);
    expect(counts.character).toBe(1);
    expect(counts.video).toBe(1);
  });
});

describe('类型标签', () => {
  it('助手 image 类型标注为通用', () => {
    expect(assetTypeLabel('image')).toBe('通用');
  });

  it('未知类型兜底为通用', () => {
    expect(assetTypeLabel('unknown')).toBe('通用');
  });

  it('识别视频资产', () => {
    expect(isVideoAsset({ type: 'video' })).toBe(true);
    expect(isVideoAsset({ type: 'scene' })).toBe(false);
  });
});
