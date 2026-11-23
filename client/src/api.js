async function readJson(res) {
  return res.json().catch(() => ({}));
}

export async function generateScript(material) {
  const res = await fetch('/api/script/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || `生成失败(${res.status})`);
  return data; // { scriptText } 或 { error, needMoreInfo: true }
}

export async function extractUpload(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/script/extract', { method: 'POST', body: fd });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || `上传失败(${res.status})`);
  return data; // { scriptText }
}

export async function parseScript(scriptText) {
  const res = await fetch('/api/script/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptText }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || `解析失败(${res.status})`);
  return data; // { scriptData }
}
