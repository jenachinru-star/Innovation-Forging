import path from 'node:path';
import mammoth from 'mammoth';

export const ALLOWED_EXTENSIONS = ['.txt', '.md', '.docx'];

export async function extractText(buffer, originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`不支持的文件类型：${ext || '(无扩展名)'}`);
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return String(result.value || '').trim();
  }
  return Buffer.from(buffer).toString('utf8').trim();
}
