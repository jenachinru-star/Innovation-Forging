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
      <h1 className="font-serif text-3xl text-amber-200">编导 AI 工作台</h1>
      <p className="mt-2 text-sm text-stone-400">
        从零散素材生成剧本，或直接上传你已有的剧本。
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-stone-700 p-1">
        <button
          onClick={() => setMode('generate')}
          className={`px-4 py-1.5 text-sm rounded-md ${mode === 'generate' ? 'bg-amber-200 text-stone-900' : 'text-stone-300'}`}
        >
          素材生成
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-1.5 text-sm rounded-md ${mode === 'upload' ? 'bg-amber-200 text-stone-900' : 'text-stone-300'}`}
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
            className="h-56 w-full rounded-lg border border-stone-700 bg-stone-900 p-4 text-sm text-stone-100 outline-none focus:border-amber-300"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMaterial(SAMPLE_MATERIAL)}
              className="text-sm text-stone-400 underline"
            >
              填入示例素材
            </button>
            <button
              onClick={handleUseSample}
              className="text-sm text-stone-400 underline"
            >
              使用样例剧本
            </button>
            <button
              onClick={handleGenerate}
              disabled={busy || offline}
              className="rounded-md bg-amber-200 px-5 py-2 text-sm font-medium text-stone-900 disabled:opacity-50"
            >
              {busy ? '生成中…' : '生成剧本'}
            </button>
          </div>
          {offline && (
            <p className="mt-2 text-sm text-amber-200">
              离线状态不可用，请使用导入剧本或样例
            </p>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div className="mt-6 rounded-lg border border-dashed border-stone-700 p-8 text-center">
          <p className="text-sm text-stone-400">支持 .txt / .md / .docx</p>
          <input
            type="file"
            accept=".txt,.md,.docx"
            onChange={handleUpload}
            disabled={busy}
            className="mt-4 text-sm text-stone-300"
          />
          {busy && <p className="mt-3 text-sm text-amber-200">解析文件中…</p>}
        </div>
      )}

      {info && <p className="mt-4 rounded-md bg-amber-900/40 p-3 text-sm text-amber-100">AI：{info}</p>}
      {error && <p className="mt-4 rounded-md bg-red-900/40 p-3 text-sm text-red-200">{error}</p>}

      {onOpenCompare && (
        <button onClick={onOpenCompare} className="mt-8 text-sm text-stone-400 underline">
          剧本版本对照
        </button>
      )}
    </div>
  );
}
