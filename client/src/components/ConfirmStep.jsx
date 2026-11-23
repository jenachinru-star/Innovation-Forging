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
      <h2 className="font-serif text-2xl">确认与编辑剧本</h2>
      <p className="muted mt-2 text-sm">
        可以直接修改下方文本，确认无误后进入排演分析。
      </p>
      <textarea
        role="textbox"
        value={scriptText}
        onChange={(e) => onChangeScriptText(e.target.value)}
        className="field mt-4 h-80 w-full p-4 font-mono text-sm leading-6"
      />
      <div className="card mt-4 rounded-lg p-4">
        <h3 className="text-sm font-medium">人物别名</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="muted text-sm">
            规范名
            <input
              type="text"
              value={canonical}
              onChange={(e) => setCanonical(e.target.value)}
              className="field mt-1 block px-3 py-1.5 text-sm"
            />
          </label>
          <label className="muted text-sm">
            别名
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="field mt-1 block px-3 py-1.5 text-sm"
            />
          </label>
          <button
            onClick={handleMerge}
            className="btn-ghost px-4 py-1.5 text-sm"
          >
            合并人物
          </button>
        </div>
        {notice && <p className="state-done mt-2 text-sm">{notice}</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={busy}
            className="btn-ghost px-4 py-2 text-sm"
          >
            重新生成
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="btn-primary px-5 py-2 text-sm font-medium"
        >
          {busy ? '分析中…' : '确认，下一步'}
        </button>
      </div>
      {error && <p className="alert-error mt-4 p-3 text-sm">{error}</p>}
    </div>
  );
}
