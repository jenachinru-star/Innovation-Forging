import { useState } from 'react';
import { extractUpload } from '../engine/index.js';
import { diffLines, buildSplitRows } from '@director/shared/diff.js';

const SAMPLE_OLD = `第一场 书房
林导演：开场灯光用冷白色。
周助理：音乐什么时候进？
林导演：等人物坐下后再进。`;

const SAMPLE_NEW = `第一场 书房
林导演：开场灯光改成暖金色。
周助理：音乐什么时候进？
林导演：等人物坐下后再进，并且要渐入。
第二场 庭院
林导演：这里加一个追光。`;

function versionLabel(version) {
  const time = version.createdAt ? String(version.createdAt) : '';
  const source = version.source ? ` · ${version.source}` : '';
  return `${time}${source}`.trim() || version.id;
}

export default function VersionCompare({ onBack, aiEnabled = false, versions = [], currentText = '' }) {
  void aiEnabled;

  const history = [...versions].reverse();
  const options = [
    { id: '__current', label: '当前版本', text: currentText || '' },
    ...history.map((version) => ({
      id: version.id,
      label: versionLabel(version),
      text: version.text || '',
    })),
  ];

  const [oldVersionId, setOldVersionId] = useState(() => history[0]?.id || '');
  const [newVersionId, setNewVersionId] = useState('__current');
  const [oldText, setOldText] = useState(() => history[0]?.text || '');
  const [newText, setNewText] = useState(() => currentText || '');
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function applyVersion(side, optionId) {
    const option = options.find((item) => item.id === optionId);
    const text = option?.text || '';
    if (side === 'old') {
      setOldVersionId(optionId);
      setOldText(text);
    } else {
      setNewVersionId(optionId);
      setNewText(text);
    }
    setRows(null);
  }

  async function load(file, setter, side) {
    setBusy(true);
    setError('');
    setRows(null);
    try {
      const { scriptText } = await extractUpload(file);
      setter(scriptText);
      if (side === 'old') setOldVersionId('');
      else setNewVersionId('');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function compare() {
    if (!oldText || !newText) return;
    setRows(buildSplitRows(diffLines(oldText, newText)));
  }

  function loadSample() {
    setOldText(SAMPLE_OLD);
    setNewText(SAMPLE_NEW);
    setOldVersionId('');
    setNewVersionId('');
    setRows(null);
    setError('');
  }

  const added = rows ? rows.filter((r) => r.op === 'add').length : 0;
  const removed = rows ? rows.filter((r) => r.op === 'remove').length : 0;

  return (
    <div className="version-compare">
      <div className="vc-header">
        <h2 className="font-serif text-2xl">剧本版本对照</h2>
        {onBack && (
          <button type="button" onClick={onBack} className="muted text-sm underline">
            返回
          </button>
        )}
      </div>

      {options.length > 1 && (
        <div className="card rounded p-3 mb-3">
          <p className="muted mb-2">作品内版本（默认当前 vs 上一版）</p>
          <div className="vc-version-grid">
            <label className="vc-version-field">
              <span className="muted text-xs">旧版本</span>
              <select value={oldVersionId} onChange={(e) => applyVersion('old', e.target.value)}>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="vc-version-field">
              <span className="muted text-xs">新版本</span>
              <select value={newVersionId} onChange={(e) => applyVersion('new', e.target.value)}>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="vc-upload-grid">
        <div className="card rounded p-3">
          <p className="muted mb-2">旧版本（上传）</p>
          <input
            type="file"
            accept=".txt,.md,.fountain,.docx,.pdf"
            onChange={(e) => e.target.files?.[0] && load(e.target.files[0], setOldText, 'old')}
          />
          <p className="muted mt-2 text-xs">{oldText ? `已加载 ${oldText.split('\n').length} 行` : '未加载'}</p>
        </div>
        <div className="card rounded p-3">
          <p className="muted mb-2">新版本（上传）</p>
          <input
            type="file"
            accept=".txt,.md,.fountain,.docx,.pdf"
            onChange={(e) => e.target.files?.[0] && load(e.target.files[0], setNewText, 'new')}
          />
          <p className="muted mt-2 text-xs">{newText ? `已加载 ${newText.split('\n').length} 行` : '未加载'}</p>
        </div>
      </div>

      <div className="vc-actions">
        <button type="button" onClick={compare} disabled={!oldText || !newText || busy} className="btn-primary px-4 py-2">
          逐行对比
        </button>
        <button type="button" onClick={loadSample} className="btn-ghost px-3 py-2">
          加载示例
        </button>
      </div>

      {error && (
        <p role="alert" className="alert-error p-3">
          {error}
        </p>
      )}

      {rows && (
        <div className="diff-split" data-testid="diff-split">
          <p className="diff-stats">
            新增 <b className="diff-add-count">{added}</b> 行 · 删除 <b className="diff-del-count">{removed}</b> 行
          </p>
          <div className="diff-split-head">
            <span>旧版本</span>
            <span>新版本</span>
          </div>
          <div className="diff-split-body">
            {rows.map((row, index) => (
              <div key={index} className={`diff-row diff-${row.op}`}>
                <div className="diff-cell diff-cell-old">{row.left || ' '}</div>
                <div className="diff-cell diff-cell-new">{row.right || ' '}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
