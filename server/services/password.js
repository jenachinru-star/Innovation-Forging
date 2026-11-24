import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// scrypt 参数（memory-hard KDF）；本地演示用 N=16384，可按硬件上调
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

// 返回 "salt:hash"（均为 hex），salt 内置且每用户唯一
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(String(password), salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `${salt}:${derived.toString('hex')}`;
}

// 恒时校验，避免时间侧信道；任何格式异常都按失败处理
export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(String(password), salt, expected.length, SCRYPT_OPTIONS);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
