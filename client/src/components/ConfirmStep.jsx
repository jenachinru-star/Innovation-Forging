import { useState } from 'react';

export default function ConfirmStep({
  scriptText,
  onChangeScriptText,
  canRegenerate,
  onRegenerate,
  onConfirm,
  busy,
  error,
}) {
  const [canonical, setCanonical] = useState('');
  const [alias, setAlias] = useState('');
  const [aliasMap, setAliasMap] = useState({});
  const [notice, setNotice] = useState('');

  function handleMerge() {
    const from = alias.trim();
    const to = canonical.trim();
    if (!from || !to || from === to) return;
    setAliasMap((prev) => ({ ...prev, [from]: to }));
    if (typeof onChangeScriptText === 'function' && scriptText.includes(from)) {
      onChangeScriptText(scriptText.split(from).join(to));
    }
    setNotice(`已将「${from}」合并为「${to}」`);
    setAlias('');
    setCanonical('');
  }

  function handleConfirm() {
    onConfirm({ aliasMap });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h2 className="font-serif text-2xl text-amber-200">确认与编辑剧本</h2>
      <p className="mt-2 text-sm text-stone-400">
        可以直接修改下方文本，确认无误后进入排演分析。
      </p>
      <textarea
        role="textbox"
        value={scriptText}
        onChange={(e) => onChangeScriptText(e.target.value)}
        className="mt-4 h-80 w-full rounded-lg border border-stone-700 bg-stone-900 p-4 font-mono text-sm leading-6 text-stone-100 outline-none focus:border-amber-300"
      />
      <div className="mt-4 rounded-lg border border-stone-700 p-4">
        <h3 className="text-sm font-medium text-stone-300">人物别名</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm text-stone-400">
            规范名
            <input
              type="text"
              value={canonical}
              onChange={(e) => setCanonical(e.target.value)}
              className="mt-1 block rounded-md border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="text-sm text-stone-400">
            别名
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="mt-1 block rounded-md border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-300"
            />
          </label>
          <button
            onClick={handleMerge}
            className="rounded-md border border-stone-600 px-4 py-1.5 text-sm text-stone-200"
          >
            合并人物
          </button>
        </div>
        {notice && <p className="mt-2 text-sm text-amber-200">{notice}</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={busy}
            className="rounded-md border border-stone-600 px-4 py-2 text-sm text-stone-200 disabled:opacity-50"
          >
            重新生成
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="rounded-md bg-amber-200 px-5 py-2 text-sm font-medium text-stone-900 disabled:opacity-50"
        >
          {busy ? '分析中…' : '确认，下一步'}
        </button>
      </div>
      {error && <p className="mt-4 rounded-md bg-red-900/40 p-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}
