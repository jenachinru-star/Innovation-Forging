import path from 'node:path';
import mammoth from 'mammoth';

export const ALLOWED_EXTENSIONS = ['.txt', '.md', '.fountain', '.docx', '.pdf'];

/**
 * 把一页 PDF 的文本项重建为带换行的文本。
 * 话剧剧本靠“角色名 + 大间距 + 台词”排版，PDF 里这个间距由真实字符的 x 坐标
 * 间隔体现（中间的宽空格 item 不可靠），因此这里跳过纯空格 item，按相邻真实字符
 * 的坐标间距还原空格数，保留“角色名/台词”的多空格分隔信号。
 */
export function pdfItemsToText(items) {
  const list = Array.isArray(items) ? items : [];
  const lines = [];
  let line = '';
  let lastChar = null;
  let runningCW = 12;

  for (const it of list) {
    const s = it.str || '';
    const x = it.transform?.[4] ?? 0;
    const isBlank = s.trim() === '';

    if (!isBlank) {
      if (lastChar) {
        const gap = x - (lastChar.x + lastChar.width);
        const spaces = Math.round(gap / runningCW);
        if (spaces >= 2) line += ' '.repeat(Math.min(spaces, 6));
        else if (spaces === 1) line += ' ';
      }
      line += s;
      const visible = s.replace(/\s/g, '');
      if (visible.length && it.width > 0) runningCW = it.width / visible.length;
      lastChar = { x, width: it.width };
    }

    if (it.hasEOL) {
      if (line.trim()) lines.push(line.trimEnd());
      line = '';
      lastChar = null;
    }
  }

  if (line.trim()) lines.push(line.trimEnd());
  return lines.join('\n');
}

async function extractPdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
  });
  const document = await loadingTask.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = pdfItemsToText(content.items).trim();
    if (text) pages.push(text);
  }
  await loadingTask.destroy();
  return pages.join('\n\n').trim();
}

export async function extractText(buffer, originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`不支持的文件类型：${ext || '(无扩展名)'}`);
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return String(result.value || '').trim();
  }
  if (ext === '.pdf') return extractPdf(buffer);
  return Buffer.from(buffer).toString('utf8').trim();
}
