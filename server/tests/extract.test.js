import { describe, it, expect, vi } from 'vitest';

vi.mock('mammoth', () => ({
  default: { extractRawText: vi.fn(async () => ({ value: '来自docx的文本' })) },
}));

import { extractText } from '../services/extract.js';

describe('extractText', () => {
  it('读取 txt', async () => {
    expect(await extractText(Buffer.from('你好剧本'), 'a.txt')).toBe('你好剧本');
  });
  it('读取 md', async () => {
    expect(await extractText(Buffer.from('# 标题'), 'a.md')).toBe('# 标题');
  });
  it('docx 走 mammoth', async () => {
    expect(await extractText(Buffer.from('x'), 'a.docx')).toBe('来自docx的文本');
  });
  it('拒绝不支持的类型', async () => {
    await expect(extractText(Buffer.from('x'), 'a.exe')).rejects.toThrow('不支持的文件类型');
  });
});
