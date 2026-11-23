import { useState } from 'react';
import { extractUpload, parseScript } from '../api.js';
import { diffScriptData } from '@director/shared/diff.js';

export default function VersionCompare({ onBack }) {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [diff, setDiff] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(file, setter) {
    setBusy(true);
    setError('');
    try {
      const { scriptText } = await extractUpload(file);
      const { scriptData } = await parseScript(scriptText);
      setter(scriptData);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function compare() {
    if (a && b) setDiff(diffScriptData(a, b));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-amber-200">剧本版本对照</h2>
        {onBack && (
          <button onClick={onBack} className="text-sm text-stone-400 underline">
            返回
          </button>
        )}
      </div>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded border border-stone-700 p-3">
            <p className="mb-2 text-stone-400">旧版本（上传）</p>
            <input type="file" accept=".txt,.md,.docx" onChange={(e) => e.target.files?.[0] && load(e.target.files[0], setA)} />
            <p className="mt-2 text-xs text-stone-500">{a ? `已解析 ${a.scenes.length} 场` : '未加载'}</p>
          </div>
          <div className="rounded border border-stone-700 p-3">
            <p className="mb-2 text-stone-400">新版本（上传）</p>
            <input type="file" accept=".txt,.md,.docx" onChange={(e) => e.target.files?.[0] && load(e.target.files[0], setB)} />
            <p className="mt-2 text-xs text-stone-500">{b ? `已解析 ${b.scenes.length} 场` : '未加载'}</p>
          </div>
        </div>
        <button onClick={compare} disabled={!a || !b || busy} className="rounded bg-amber-200 px-4 py-2 text-stone-900 disabled:opacity-50">对比</button>
        {error && <p className="rounded bg-red-900/40 p-3 text-red-200">{error}</p>}
        {diff && (
          <div className="space-y-2">
            <p>新增场次：{diff.addedScenes.join('、') || '无'}</p>
            <p>删除场次：{diff.removedScenes.join('、') || '无'}</p>
            <p>改动场次：{diff.changedScenes.map((c) => c.title).join('、') || '无'}</p>
            <p>新增人物：{diff.characterDelta.added.join('、') || '无'}；删除人物：{diff.characterDelta.removed.join('、') || '无'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
