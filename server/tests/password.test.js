import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../services/password.js';

describe('password 服务', () => {
  it('哈希后不含明文且由 salt 与 hash 两段组成', () => {
    const stored = hashPassword('secret123');
    expect(stored).not.toContain('secret123');
    expect(stored.split(':')).toHaveLength(2);
  });

  it('正确密码通过、错误密码失败', () => {
    const stored = hashPassword('secret123');
    expect(verifyPassword('secret123', stored)).toBe(true);
    expect(verifyPassword('wrongpass', stored)).toBe(false);
  });

  it('格式异常的 stored 安全返回 false', () => {
    expect(verifyPassword('x', 'garbage')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
  });

  it('相同密码因随机 salt 产生不同哈希', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });
});
