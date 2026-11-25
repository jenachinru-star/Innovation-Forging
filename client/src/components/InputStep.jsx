import { useState } from 'react';
import { generateScript, extractUpload, getSourceMode } from '../engine/index.js';
import { SAMPLE_TEXT } from '@director/shared/samples/oneAct.js';

const SAMPLE_MATERIAL = [
  '一对多年未见的老朋友在医院病房重逢。',
  '老陈刚确诊重病，一直瞒着家人；老周是唯一知情的人，却不知该不该说出真相。',
  '两人聊起年轻时一起排过的一出戏。请写成一场戏。',
].join('\n');

function EntryIcon({ name }) {
  const paths = {
    paste: 'M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 12h8M8 16h5',
    upload: 'M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z',
    edit: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Zm11.5-13.5 2 2',
  };
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

const ENTRIES = [
  { id: 'paste', name: 'paste', label: '粘贴剧本', hint: '直接粘贴文本' },
  { id: 'upload', name: 'upload', label: '导入文件', hint: '支持 txt / docx / fountain' },
  { id: 'generate', name: 'spark', label: 'AI 生成', hint: '一句话灵感生成初稿', highlight: true },
];

export default function InputStep({
  onReady,
  initialText = '',
  busy,
  setBusy,
  error,
  setError,
  onOpenCompare,
  aiEnabled = true,
  onAiEnabledChange,
}) {
  const hasExisting = Boolean(initialText);
  const [mode, setMode] = useState(hasExisting ? 'paste' : 'generate'); // generate | paste | upload
  const [material, setMaterial] = useState(initialText);
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

  function handlePaste() {
    if (!material.trim()) {
      setError('请先粘贴剧本内容');
      return;
    }
    onReady({ scriptText: material, material: '', mode: 'paste' });
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
    <div className="entry2">
      <header className="entry2-head">
        <h1>从一个剧本开始</h1>
        <p>无论是粘贴、导入，还是让 AI 帮你创作，都能开启属于你的排练之旅。</p>
      </header>

      {hasExisting && (
        <div className="entry2-existing" role="status">
          <span aria-hidden="true">📄</span>
          <p>
            这是你<b>当前的剧本</b>，可以直接在下面修改；想换个来源或重新创作，点上面的卡片即可。
          </p>
        </div>
      )}

      <div className="entry2-cards" role="group" aria-label="剧本来源方式">
        {ENTRIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setMode(entry.id)}
            className={`entry2-card ${mode === entry.id ? 'is-active' : ''} ${
              entry.highlight ? 'is-spark' : ''
            }`}
          >
            <span className="entry2-card-icon">
              <EntryIcon name={entry.name} />
            </span>
            <b>{entry.label}</b>
            <span>{entry.hint}</span>
          </button>
        ))}
      </div>

      <div className="entry2-input">
        {mode !== 'upload' ? (
          <>
            <span className="entry2-input-label">
              <EntryIcon name="edit" />
              {mode === 'generate' ? '在此输入灵感……' : '在此粘贴剧本或输入灵感……'}
            </span>
            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="输入你的想法、对话片段或人物设定（可混合）……"
              className="entry2-textarea"
            />
            <div className="entry2-quick">
              <button type="button" onClick={() => setMaterial(SAMPLE_MATERIAL)} className="text-action">
                填入示例素材
              </button>
              <button type="button" onClick={handleUseSample} className="text-action">
                使用样例剧本
              </button>
            </div>
          </>
        ) : (
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
      </div>

      {info && (
        <p role="status" className="alert-note entry2-msg">
          AI：{info}
        </p>
      )}
      {error && (
        <p role="alert" className="alert-error entry2-msg">
          {error}
        </p>
      )}
      {offline && mode === 'generate' && (
        <p className="state-doing entry2-msg">离线状态不可用，请使用导入剧本或样例</p>
      )}

      <footer className="entry2-footer">
        <div className="entry2-ai">
          <span className="entry2-ai-title">启用 AI 辅助</span>
          <span className="entry2-ai-hint">基于上下文提供智能建议</span>
          <label className="entry2-toggle">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(event) => onAiEnabledChange?.(event.target.checked)}
            />
            <span aria-hidden="true" />
          </label>
        </div>
        {mode === 'generate' && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy || offline || !aiEnabled}
            className="btn-seal entry2-submit"
          >
            {busy ? '生成中…' : '下一步'}
          </button>
        )}
        {mode === 'paste' && (
          <button type="button" onClick={handlePaste} className="btn-seal entry2-submit">
            下一步
          </button>
        )}
        {onOpenCompare && (
          <button type="button" onClick={onOpenCompare} className="text-action entry2-compare">
            剧本版本对照
          </button>
        )}
      </footer>
    </div>
  );
}
