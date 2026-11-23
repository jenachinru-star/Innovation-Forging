import { useState } from 'react';
import { generateScript, extractUpload, getSourceMode } from '../engine/index.js';
import { SAMPLE_TEXT } from '@director/shared/samples/oneAct.js';

const SAMPLE_MATERIAL = [
  '一对多年未见的老朋友在医院病房重逢。',
  '老陈刚确诊重病，一直瞒着家人；老周是唯一知情的人，却不知该不该说出真相。',
  '两人聊起年轻时一起排过的一出戏。请写成一场戏。',
].join('\n');

export default function InputStep({ onReady, busy, setBusy, error, setError, onOpenCompare }) {
  const [mode, setMode] = useState('generate'); // generate | upload
  const [material, setMaterial] = useState('');
  const [info, setInfo] = useState('');
  const [offline, setOffline] = useState(() => getSourceMode() === 'local');

  async function handleGenerate() {
    if (!material.trim()) {
      setError('请先输入素材内容');
      return;
    }
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const data = await generateScript(material);
      if (data.needMoreInfo) {
        setInfo(data.error);
        return;
      }
      onReady({ scriptText: data.scriptText, material, mode: 'generate' });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
      setOffline(getSourceMode() === 'local');
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const data = await extractUpload(file);
      onReady({ scriptText: data.scriptText, material: '', mode: 'upload' });
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
      setOffline(getSourceMode() === 'local');
    }
  }

  function handleUseSample() {
    onReady({ scriptText: SAMPLE_TEXT, material: '', mode: 'sample' });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl">编导 AI 工作台</h1>
      <p className="muted mt-2 text-sm">
        从零散素材生成剧本，或直接上传你已有的剧本。
      </p>

      <div className="hairline mt-6 inline-flex rounded-lg p-1">
        <button
          onClick={() => setMode('generate')}
          className={`rounded-md px-4 py-1.5 text-sm ${mode === 'generate' ? 'btn-primary' : 'muted'}`}
        >
          素材生成
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`rounded-md px-4 py-1.5 text-sm ${mode === 'upload' ? 'btn-primary' : 'muted'}`}
        >
          上传剧本
        </button>
      </div>

      {mode === 'generate' && (
        <div className="mt-6">
          <textarea
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="输入你的想法、对话片段或人物设定（可混合）……"
            className="field h-56 w-full p-4 text-sm"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMaterial(SAMPLE_MATERIAL)}
              className="muted text-sm underline"
            >
              填入示例素材
            </button>
            <button
              onClick={handleUseSample}
              className="muted text-sm underline"
            >
              使用样例剧本
            </button>
            <button
              onClick={handleGenerate}
              disabled={busy || offline}
              className="btn-primary px-5 py-2 text-sm font-medium"
            >
              {busy ? '生成中…' : '生成剧本'}
            </button>
          </div>
          {offline && (
            <p className="state-doing mt-2 text-sm">
              离线状态不可用，请使用导入剧本或样例
            </p>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div
          className="mt-6 rounded-lg border border-dashed p-8 text-center"
          style={{ borderColor: 'var(--line)' }}
        >
          <p className="muted text-sm">支持 .txt / .md / .docx</p>
          <input
            type="file"
            accept=".txt,.md,.docx"
            onChange={handleUpload}
            disabled={busy}
            className="mt-4 text-sm"
          />
          {busy && <p className="state-doing mt-3 text-sm">解析文件中…</p>}
        </div>
      )}

      {info && <p className="alert-note mt-4 p-3 text-sm">AI：{info}</p>}
      {error && <p className="alert-error mt-4 p-3 text-sm">{error}</p>}

      {onOpenCompare && (
        <button onClick={onOpenCompare} className="muted mt-8 text-sm underline">
          剧本版本对照
        </button>
      )}
    </div>
  );
}
