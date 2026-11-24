import { describe, it, expect } from 'vitest';
import { generateCharacterImage } from '../services/seedream.js';

it('返回图片 URL，且请求含固定风格描述', async () => {
  let captured;
  const fetchImpl = async (url, opts) => {
    captured = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ data: [{ url: 'http://img/1.png' }] }) };
  };
  const url = await generateCharacterImage('55岁退休教师，表情温和', { fetchImpl });
  expect(url).toBe('http://img/1.png');
  expect(captured.prompt).toContain('水彩插画风格');
});

it('作品视觉提示会覆盖默认人物风格', async () => {
  let captured;
  const fetchImpl = async (url, opts) => {
    captured = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ data: [{ url: 'http://img/2.png' }] }) };
  };
  await generateCharacterImage('老陈，55岁', {
    fetchImpl,
    stylePrompt: '主色 #1A1918，冷灰与警示红',
  });
  expect(captured.prompt).toContain('主色 #1A1918');
  expect(captured.prompt).not.toContain('水彩插画风格');
});
