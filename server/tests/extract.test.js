import { describe, it, expect, vi } from 'vitest';

vi.mock('mammoth', () => ({
  default: { extractRawText: vi.fn(async () => ({ value: '来自docx的文本' })) },
}));

import { extractText, pdfItemsToText } from '../services/extract.js';

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

describe('pdfItemsToText', () => {
  // 构造 transform=[a,b,c,d,x,y]，只用 x（index 4）
  function item(str, x, width, hasEOL = false) {
    return { str, transform: [0, 0, 0, 0, x, 600], width, hasEOL };
  }

  it('跳过宽空格 item，按真实字符坐标间距还原空格', () => {
    const items = [
      item('林', 90, 12),
      item(' ', 102, 240), // 角色名内部宽空格
      item('越', 114, 12),
      item(' ', 126, 484), // 角色名/台词间宽空格
      item('台词内容', 150, 48, true),
    ];
    expect(pdfItemsToText(items)).toBe('林 越  台词内容');
  });

  it('紧邻字符不额外加空格，单字符间距只加一个', () => {
    const items = [
      item('苏曼宁', 90, 36),
      item(' ', 126, 480),
      item('今天', 150, 24, true),
    ];
    expect(pdfItemsToText(items)).toBe('苏曼宁  今天');
  });

  it('空输入返回空字符串', () => {
    expect(pdfItemsToText([])).toBe('');
  });
});

