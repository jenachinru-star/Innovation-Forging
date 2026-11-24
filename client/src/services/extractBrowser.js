function extensionOf(name) {
  const match = String(name || '').toLowerCase().match(/\.([^.]+)$/);
  return match ? match[1] : '';
}

async function extractDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser.js');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return String(result.value || '').trim();
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
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

export async function extractBrowserFile(file) {
  const ext = extensionOf(file?.name);
  if (['txt', 'md', 'markdown', 'fountain'].includes(ext)) {
    return (await file.text()).trim();
  }
  if (ext === 'docx') return extractDocx(file);
  if (ext === 'pdf') return extractPdf(file);
  throw new Error('本地模式支持 TXT、MD、Fountain、DOCX 和可提取文字的 PDF。');
}
