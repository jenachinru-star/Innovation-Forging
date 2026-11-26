import { describe, it, expect } from 'vitest';
import { normalizeCharacter } from '@director/shared';
import { characterSchema } from '../schemas/scriptData.js';

describe('Character role 字段', () => {
  it('normalizeCharacter 保留 role', () => {
    expect(normalizeCharacter({ name: '老陈', role: '主角' }).role).toBe('主角');
  });

  it('normalizeCharacter 缺省 role 为空串', () => {
    expect(normalizeCharacter({ name: '老陈' }).role).toBe('');
  });

  it('characterSchema 接受 role', () => {
    expect(characterSchema.parse({ id: 'ch-1', name: '老陈', role: '配角' }).role).toBe('配角');
  });

  it('characterSchema 缺省 role 为空串', () => {
    expect(characterSchema.parse({ id: 'ch-1', name: '老陈' }).role).toBe('');
  });
});