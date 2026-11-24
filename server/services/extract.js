import path from 'node:path';
import mammoth from 'mammoth';

export const ALLOWED_EXTENSIONS = ['.txt', '.md', '.fountain', '.docx', '.pdf'];

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
    const text = content.items
      .map((item) => `${item.str || ''}${item.hasEOL ? '\n' : ' '}`)
      .join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
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
