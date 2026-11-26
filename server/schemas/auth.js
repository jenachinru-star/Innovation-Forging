import { z } from 'zod';

const username = z
  .string({ required_error: '请输入用户名' })
  .trim()
  .regex(/^[一-龥A-Za-z0-9_-]{2,32}$/, '用户名需为 2–32 位中英文、字母数字、下划线或连字符');

const password = z
  .string({ required_error: '请输入密码' })
  .min(6, '密码至少 6 位')
  .max(64, '密码过长');

const remember = z.boolean().optional();

export const registerSchema = z.object({
  username,
  password,
  remember,
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  remember,
});
