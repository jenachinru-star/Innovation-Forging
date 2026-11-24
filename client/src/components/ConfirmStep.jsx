import { useState } from 'react';

export default function ConfirmStep({
  scriptText,
  onChangeScriptText,
  canRegenerate,
  onRegenerate,
  onConfirm,
  busy,
  error,
  aiEnabled = false,
  onAiEnabledChange,
  onOpenCompare,
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
    <div className="confirm-workspace">
      <header className="workspace-toolbar confirm-heading">
        <div>
          <span className="eyebrow">01 · 剧本校对</span>
          <h2 className="workspace-title">确认与编辑剧本</h2>
          <p className="workspace-lede">
            先把原文改到可信。确认后，场次、人物、道具和提示都会从这份文本建立引用关系。
          </p>
        </div>
        <span className="source-label">原文 · 用户可编辑</span>
      </header>

      <div className="confirm-grid">
        <section className="manuscript-panel">
          <div className="manuscript-head">
            <span className="field-label">剧本文本</span>
            <span>{scriptText.length} 字</span>
          </div>
          <textarea
            role="textbox"
            value={scriptText}
            onChange={(e) => onChangeScriptText(e.target.value)}
            className="field manuscript-editor"
          />
        </section>

        <aside className="confirm-aside">
          <div className="confirm-card">
            <span className="field-label">结构校对</span>
            <h3>人物别名</h3>
            <p>把同一人物的不同称呼合并，避免排演表里出现两套名字。</p>
            <label>
              规范名
              <input
                type="text"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
                className="field"
              />
            </label>
            <label>
              别名
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="field"
              />
            </label>
            <button type="button" onClick={handleMerge} className="btn-ghost btn-small">
              合并人物
            </button>
            {notice && <p className="state-done confirm-notice">{notice}</p>}
          </div>

          <div className="confirm-card ai-consent-card">
            <span className="field-label">智能增强</span>
            <label className="ai-consent-row">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(event) => onAiEnabledChange?.(event.target.checked)}
              />
              <span>
                <b>允许此作品自动调用文本 AI</b>
                <small>本地规则始终可用；图片和视频等付费任务仍需逐项确认。</small>
              </span>
            </label>
          </div>

          <div className="confirm-next">
            <span className="field-label">确认后</span>
            <b>建立第一版排演结构</b>
            <p>解析会保留原文范围；判断不确定的关系会进入待复核，而不是自动当成事实。</p>
          </div>
        </aside>
      </div>

      <div className="confirm-actions">
        {onOpenCompare && (
          <button type="button" onClick={onOpenCompare} className="btn-ghost">
            版本对照
          </button>
        )}
        {canRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy}
            className="btn-ghost"
          >
            重新生成
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="btn-primary"
        >
          {busy ? '分析中…' : '确认，下一步'}
        </button>
      </div>
      {error && <p role="alert" className="alert-error confirm-error">{error}</p>}
    </div>
  );
}
