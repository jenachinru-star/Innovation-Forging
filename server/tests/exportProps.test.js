import { describe, it, expect } from 'vitest';
import { toPropsCsv, toCharacterAppearanceCsv } from '@director/shared/export/index.js';

const scriptData = {
  scenes: [
    { sceneNumber: 1, title: '第一场', props: ['雨伞', '旧相册'], characters: ['老陈', '小林'] },
    { sceneNumber: 2, title: '第二场', props: ['信'], characters: ['老陈'] },
  ],
  characters: [
    { id: 'ch-1', name: '老陈' },
    { id: 'ch-2', name: '小林' },
  ],
};

describe('toPropsCsv', () => {
  it('每场次每道具一行，含表头与 BOM', () => {
    const csv = toPropsCsv(scriptData);
    expect(csv[0]).toBe('\uFEFF');
    expect(csv.split('\n')[0]).toBe('\uFEFF场次,道具');
    expect(csv).toContain('第一场,雨伞');
    expect(csv).toContain('第一场,旧相册');
    expect(csv).toContain('第二场,信');
  });

  it('无道具时只有表头', () => {
    expect(toPropsCsv({ scenes: [{ sceneNumber: 1 }] })).toBe('\uFEFF场次,道具');
  });
});

describe('toCharacterAppearanceCsv', () => {
  it('每个人物一行含出场场次与次数', () => {
    const csv = toCharacterAppearanceCsv(scriptData);
    expect(csv.split('\n')[0]).toBe('\uFEFF人物,出场场次,出场次数');
    expect(csv).toContain('老陈,第一场、第二场,2');
    expect(csv).toContain('小林,第一场,1');
  });
});