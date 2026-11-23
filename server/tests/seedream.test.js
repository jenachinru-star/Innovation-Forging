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
