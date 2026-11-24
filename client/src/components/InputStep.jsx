import { useState } from 'react';
import { generateScript, extractUpload, getSourceMode } from '../engine/index.js';
import { SAMPLE_TEXT } from '@director/shared/samples/oneAct.js';

const SAMPLE_MATERIAL = [
  '一对多年未见的老朋友在医院病房重逢。',
  '老陈刚确诊重病，一直瞒着家人；老周是唯一知情的人，却不知该不该说出真相。',
  '两人聊起年轻时一起排过的一出戏。请写成一场戏。',
].join('\n');

export default function InputStep({
  onReady,
  busy,
  setBusy,
  error,
  setError,
  onOpenCompare,
  aiEnabled = true,
  onAiEnabledChange,
}) {
  const [mode, setMode] = useState('generate'); // generate | upload
  const [material, setMaterial] = useState('');
  const [info, setInfo] = useState('');
  const [offline, setOffline] = useState(() => getSourceMode() === 'local');

  async function handleGenerate() {
    if (!material.trim()) {
      setError('请先输入素材内容');
      return;
    }
    if (!aiEnabled) {
      setError('请先允许此作品使用外部文本 AI，或改用导入剧本和样例。');
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
    <div className="entry-workspace">
      <header className="entry-heading">
        <div>
          <span className="eyebrow">01 · 剧本来源</span>
          <h1>先把作品带到工作台上</h1>
          <p className="entry-lede">
            从零散素材起稿，或导入已经写成的剧本。先确认原文，再让结构进入排演。
          </p>
        </div>
        <div className="entry-proof">
          <span>本地优先</span>
          <b>原文、决定和提示始终分开记录</b>
        </div>
      </header>

      <div className="entry-grid">
        <section className="entry-editor" aria-label="剧本输入">
          <div className="entry-tabs" aria-label="剧本来源方式">
            <button
              type="button"
              aria-pressed={mode === 'generate'}
              onClick={() => setMode('generate')}
              className={mode === 'generate' ? 'is-active' : ''}
            >
              素材生成
            </button>
            <button
              type="button"
              aria-pressed={mode === 'upload'}
              onClick={() => setMode('upload')}
              className={mode === 'upload' ? 'is-active' : ''}
            >
              上传剧本
            </button>
          </div>

          {mode === 'generate' && (
            <div className="entry-mode-panel">
              <label htmlFor="material-input" className="field-label">
                素材、对白、人物关系或场景想法
              </label>
              <textarea
                id="material-input"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="输入你的想法、对话片段或人物设定（可混合）……"
                className="field entry-textarea"
              />
              <div className="entry-actions">
                <button
                  type="button"
                  onClick={() => setMaterial(SAMPLE_MATERIAL)}
                  className="text-action"
                >
                  填入示例素材
                </button>
                <button type="button" onClick={handleUseSample} className="text-action">
                  使用样例剧本
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={busy || offline || !aiEnabled}
                  className="btn-seal entry-submit"
                >
                  {busy ? '生成中…' : '生成剧本'}
                </button>
              </div>
              {offline && (
                <p className="state-doing entry-hint">
                  离线状态不可用，请使用导入剧本或样例
                </p>
              )}
              {!offline && (
                <label className="ai-entry-consent">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(event) => onAiEnabledChange?.(event.target.checked)}
                  />
                  允许此作品使用外部文本 AI；媒体生成仍需逐项确认
                </label>
              )}
            </div>
          )}

          {mode === 'upload' && (
            <div className="upload-zone">
              <span className="upload-number">TXT · MD · DOCX</span>
              <b>把剧本文件放到这里</b>
              <p>当前版本优先支持文本型剧本；扫描版 PDF 需要可提取文字。</p>
              <input
                type="file"
                accept=".txt,.md,.docx,.pdf,.fountain"
                onChange={handleUpload}
                disabled={busy}
                aria-label="选择剧本文件"
              />
              {busy && <p className="state-doing">解析文件中…</p>}
            </div>
          )}

          {info && <p role="status" className="alert-note mt-4 p-3 text-sm">AI：{info}</p>}
          {error && <p role="alert" className="alert-error mt-4 p-3 text-sm">{error}</p>}
        </section>

        <aside className="entry-aside">
          <span className="field-label">接下来</span>
          <ol className="entry-steps">
            <li>
              <span>01</span>
              确认原文与人物别名
            </li>
            <li>
              <span>02</span>
              拆出场次、道具与关系
            </li>
            <li>
              <span>03</span>
              进入走位、cue 和部门准备
            </li>
          </ol>
          <div className="sample-note">
            <span className="field-label">推荐首次体验</span>
            <b>使用内置独幕剧样例</b>
            <p>三场、三角色，已包含灯光、雨声、道具与一条可用来演示修改影响的台词。</p>
            <button type="button" className="btn-ghost btn-small" onClick={handleUseSample}>
              打开样例剧本
            </button>
          </div>
          {onOpenCompare && (
            <button type="button" onClick={onOpenCompare} className="text-action entry-compare">
              剧本版本对照
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
