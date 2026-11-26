import { useEffect, useMemo, useRef, useState } from 'react';
import { parseOffline } from '../engine/index.js';
import scriptBg from '../assets/visual/script-bg.jpg';
import {
  highlightScript,
  SPEAKER_PALETTE,
  tokenizeLine,
} from '../engine/scriptHighlight.js';
import {
  applyKindAtCursor,
  countHeading,
  currentTokenAt,
  insertBlock,
  insertDialogue,
  lineRangeAt,
  suggestCharacters,
  toChineseNum,
  unwrapLine,
} from '../engine/scriptEdit.js';

function HighlightEditor({ value, onChange, characterNames = [] }) {
  const lineCount = Math.max(value.split('\n').length, 1);
  const gutterRef = useRef(null);
  const preRef = useRef(null);
  const taRef = useRef(null);

  // 撤销 / 重做历史栈
  const presentRef = useRef(value);
  const lastEmittedRef = useRef(value);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const pendingSelRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 查找 / 替换
  const [findOpen, setFindOpen] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);

  // 加台词菜单 + 人物名自动补全
  const [speakerMenuOpen, setSpeakerMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [gutterMenu, setGutterMenu] = useState(null);

  const TYPE_LABEL = {
    act: '幕',
    scene: '场景',
    direction: '说明',
    dialogue: '对白',
    cast: '人物表',
    metaScene: '场景',
    metaCharacter: '人物',
    empty: '空行',
    other: '普通',
  };
  const KIND_OPTIONS = [
    { id: 'scene', label: '场景' },
    { id: 'dialogue', label: '对白' },
    { id: 'direction', label: '说明' },
    { id: 'plain', label: '普通文字' },
  ];

  const lineTypes = useMemo(
    () => value.split('\n').map((line) => tokenizeLine(line).type),
    [value]
  );

  // 外部（别名合并等）直接改 value：同步基线、清空历史，不进撤销栈
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    presentRef.current = value;
    lastEmittedRef.current = value;
    pastRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [value]);

  // 插入元素后恢复光标位置
  useEffect(() => {
    const pos = pendingSelRef.current;
    const ta = taRef.current;
    if (pos != null && ta) {
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }
    pendingSelRef.current = null;
  });

  function syncScroll() {
    if (gutterRef.current && taRef.current) {
      gutterRef.current.scrollTop = taRef.current.scrollTop;
    }
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
    }
  }

  const html = useMemo(() => highlightScript(value), [value]);

  function updateFlags() {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }

  function emit(next) {
    presentRef.current = next;
    lastEmittedRef.current = next;
    onChange(next);
  }

  function commit(next) {
    if (next === presentRef.current) return;
    pastRef.current.push(presentRef.current);
    futureRef.current = [];
    emit(next);
    updateFlags();
  }

  function handleTextChange(event) {
    commit(event.target.value);
    refreshSuggestions();
  }

  // ===== 元素插入 / 行级转换 =====
  function buildSnippet(kind, ctx) {
    if (kind === 'act') return `第${toChineseNum(ctx.actNumber)}幕\n`;
    if (kind === 'scene') return `第${toChineseNum(ctx.sceneNumber)}场 \n`;
    if (kind === 'direction') return '（）\n';
    return '人物：';
  }

  function snippetCursorFromEnd(kind) {
    if (kind === 'scene') return 1;
    if (kind === 'direction') return 2;
    return 0;
  }

  // 选中文字 → 转换该行类型；无选中 → 插入新元素
  function handleElement(kind) {
    const ta = taRef.current;
    const doc = presentRef.current;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const ctx = {
      actNumber: countHeading(doc, /^第[零一二两三四五六七八九十百\d]+幕/gm) + 1,
      sceneNumber: countHeading(doc, /^第[零一二两三四五六七八九十百\d]+场/gm) + 1,
    };
    const result =
      selStart !== selEnd
        ? applyKindAtCursor(doc, selStart, kind, ctx)
        : insertBlock(doc, selStart, selEnd, buildSnippet(kind, ctx), snippetCursorFromEnd(kind));
    pendingSelRef.current = result.cursor;
    commit(result.text);
    setSuggestions([]);
  }

  function chooseSpeaker(speaker) {
    const ta = taRef.current;
    const result = insertDialogue(presentRef.current, ta.selectionStart, ta.selectionEnd, speaker);
    pendingSelRef.current = result.cursor;
    commit(result.text);
    setSpeakerMenuOpen(false);
    setSuggestions([]);
  }

  // 从行号区点击，纠正某一行的类型
  function gutterKind(index, kind) {
    const doc = presentRef.current;
    const lines = doc.split('\n');
    let pos = 0;
    for (let i = 0; i < index; i += 1) pos += lines[i].length + 1;
    const ctx = {
      actNumber: countHeading(doc, /^第[零一二两三四五六七八九十百\d]+幕/gm) + 1,
      sceneNumber: countHeading(doc, /^第[零一二两三四五六七八九十百\d]+场/gm) + 1,
    };
    let result;
    if (kind === 'plain') {
      const { start, end } = lineRangeAt(doc, pos);
      const content = unwrapLine(doc.slice(start, end)).content;
      result = { text: doc.slice(0, start) + content + doc.slice(end), cursor: start + content.length };
    } else {
      result = applyKindAtCursor(doc, pos, kind, ctx);
    }
    pendingSelRef.current = result.cursor;
    commit(result.text);
    setGutterMenu(null);
  }

  // ===== 人物名自动补全 =====
  function refreshSuggestions() {
    const ta = taRef.current;
    if (!ta) return;
    const info = currentTokenAt(presentRef.current, ta.selectionStart);
    if (!info || !info.token) {
      setSuggestions([]);
      return;
    }
    setSuggestions(suggestCharacters(info.token, characterNames));
    setSuggestionIndex(0);
  }

  function acceptSuggestion(name) {
    const ta = taRef.current;
    const info = currentTokenAt(presentRef.current, ta.selectionStart);
    if (!info) return;
    const doc = presentRef.current;
    const next = doc.slice(0, info.start) + name + doc.slice(info.end);
    pendingSelRef.current = info.start + name.length;
    commit(next);
    setSuggestions([]);
  }

  function handleKeyDown(event) {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSuggestionIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      acceptSuggestion(suggestions[suggestionIndex]);
    } else if (event.key === 'Escape') {
      setSuggestions([]);
    }
  }

  function undo() {
    if (!pastRef.current.length) return;
    futureRef.current.push(presentRef.current);
    const prev = pastRef.current.pop();
    emit(prev);
    updateFlags();
  }

  function redo() {
    if (!futureRef.current.length) return;
    pastRef.current.push(presentRef.current);
    const next = futureRef.current.pop();
    emit(next);
    updateFlags();
  }

  const findPositions = useMemo(() => {
    if (!findOpen || !findTerm) return [];
    const positions = [];
    let idx = value.indexOf(findTerm);
    while (idx !== -1) {
      positions.push(idx);
      idx = value.indexOf(findTerm, idx + findTerm.length);
    }
    return positions;
  }, [findOpen, findTerm, value]);

  function selectMatch(index) {
    const pos = findPositions[index];
    const ta = taRef.current;
    if (pos == null || !ta) return;
    ta.focus();
    ta.setSelectionRange(pos, pos + findTerm.length);
  }

  function goFind(delta) {
    if (!findPositions.length) return;
    const next = (findIndex + delta + findPositions.length) % findPositions.length;
    setFindIndex(next);
    selectMatch(next);
  }

  function closeFind() {
    setFindOpen(false);
    setFindTerm('');
    setFindIndex(0);
    setReplaceTerm('');
    setShowReplace(false);
  }

  function replaceOne() {
    const pos = findPositions[findIndex];
    if (pos == null || !findTerm) return;
    const doc = presentRef.current;
    const next = doc.slice(0, pos) + replaceTerm + doc.slice(pos + findTerm.length);
    pendingSelRef.current = pos + replaceTerm.length;
    commit(next);
  }

  function replaceAll() {
    if (!findTerm) return;
    commit(presentRef.current.split(findTerm).join(replaceTerm));
  }

  return (
    <div className="cf-editor-wrap">
      <div className="cf-element-bar">
        <div className="cf-insert-group">
          <button type="button" className="cf-elem" onClick={() => handleElement('act')}>
            幕
          </button>
          <button type="button" className="cf-elem" onClick={() => handleElement('scene')}>
            场
          </button>
          <button type="button" className="cf-elem" onClick={() => handleElement('direction')}>
            说明
          </button>
          <button type="button" className="cf-elem" onClick={() => handleElement('dialogue')}>
            对白
          </button>
          <span className="cf-elem-sep" aria-hidden="true" />
          <div className="cf-speaker-wrap">
            <button
              type="button"
              className="cf-elem cf-speaker-btn"
              aria-expanded={speakerMenuOpen}
              onClick={() => setSpeakerMenuOpen((prev) => !prev)}
            >
              ＋加台词
            </button>
            {speakerMenuOpen && (
              <ul className="cf-speaker-menu" role="menu" aria-label="选择说话的角色">
                {characterNames.length === 0 && (
                  <li className="cf-menu-empty">先在剧本里写出角色</li>
                )}
                {characterNames.map((name) => (
                  <li key={name}>
                    <button type="button" role="menuitem" onClick={() => chooseSpeaker(name)}>
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="cf-edit-group">
          <button
            type="button"
            title="撤销"
            aria-label="撤销"
            className="cf-tool"
            onClick={undo}
            disabled={!canUndo}
          >
            ↺
          </button>
          <button
            type="button"
            title="重做"
            aria-label="重做"
            className="cf-tool"
            onClick={redo}
            disabled={!canRedo}
          >
            ↻
          </button>
          <button
            type="button"
            title="查找"
            aria-label="查找"
            className={'cf-tool' + (findOpen ? ' is-active' : '')}
            onClick={() => setFindOpen((prev) => !prev)}
          >
            ⌕
          </button>
        </div>
      </div>

      {findOpen && (
        <div className="cf-findbar">
          <div className="cf-find-row">
            <input
              type="text"
              aria-label="查找内容"
              placeholder="查找剧本…"
              value={findTerm}
              onChange={(event) => {
                setFindTerm(event.target.value);
                setFindIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') goFind(1);
                if (event.key === 'Escape') closeFind();
              }}
            />
            <button type="button" aria-label="上一个匹配" onClick={() => goFind(-1)}>
              ‹
            </button>
            <button type="button" aria-label="下一个匹配" onClick={() => goFind(1)}>
              ›
            </button>
            <span className="cf-find-count">
              {findPositions.length ? findIndex + 1 : 0} / {findPositions.length}
            </span>
            <button
              type="button"
              aria-label="展开替换"
              className={showReplace ? 'is-active' : ''}
              onClick={() => setShowReplace((prev) => !prev)}
            >
              ⇄
            </button>
            <button type="button" aria-label="关闭查找" onClick={closeFind}>
              ✕
            </button>
          </div>
          {showReplace && (
            <div className="cf-find-row">
              <input
                type="text"
                aria-label="替换为"
                placeholder="替换为…"
                value={replaceTerm}
                onChange={(event) => setReplaceTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') replaceOne();
                }}
              />
              <button type="button" onClick={replaceOne} className="cf-replace-btn">
                替换
              </button>
              <button type="button" onClick={replaceAll} className="cf-replace-btn">
                全部替换
              </button>
            </div>
          )}
        </div>
      )}

      <div className="cf-editor">
        <div className="cf-gutter" ref={gutterRef}>
          {lineTypes.map((type, index) => (
            <span key={index} className="cf-gutter-line">
              <span className="cf-gutter-num">{index + 1}</span>
              <button
                type="button"
                title={`这行是「${TYPE_LABEL[type] || '普通'}」，点击改类型`}
                className={`cf-type-dot t-${type}`}
                onClick={() => setGutterMenu(gutterMenu === index ? null : index)}
              />
            </span>
          ))}
        </div>
        <div className="cf-code">
          <pre
            ref={preRef}
            aria-hidden="true"
            className="cf-highlight"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <textarea
            ref={taRef}
            onScroll={syncScroll}
            role="textbox"
            aria-label="剧本编辑器"
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="cf-textarea"
            spellCheck={false}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="cf-suggest" role="listbox" aria-label="人物补全">
              {suggestions.map((name, i) => (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === suggestionIndex}
                    className={i === suggestionIndex ? 'is-active' : ''}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      acceptSuggestion(name);
                    }}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {gutterMenu != null && (
        <div className="cf-type-menu" role="menu" aria-label="修改这行的类型">
          <p className="cf-type-menu-title">第 {gutterMenu + 1} 行改成：</p>
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitem"
              onClick={() => gutterKind(gutterMenu, opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function tierFor(count, max) {
  const ratio = count / (max || 1);
  if (ratio >= 0.6) return '核心';
  if (ratio >= 0.35) return '重要';
  if (ratio >= 0.15) return '次要';
  return '配角';
}

export default function ConfirmStep({
  scriptText,
  onChangeScriptText,
  canRegenerate,
  onRegenerate,
  onConfirm,
  onBack,
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
  const [actFilter, setActFilter] = useState('all');
  const [showGuide, setShowGuide] = useState(true);

  // 实时离线解析预览（纯前端、零网络）
  const preview = useMemo(() => {
    try {
      return parseOffline(scriptText).scriptData;
    } catch {
      return null;
    }
  }, [scriptText]);

  const lineCounts = useMemo(() => {
    const counts = {};
    for (const scene of preview?.scenes || []) {
      for (const line of scene.lines || []) {
        if (line.speaker) counts[line.speaker] = (counts[line.speaker] || 0) + 1;
      }
    }
    return counts;
  }, [preview]);

  const roster = useMemo(() => {
    const list = (preview?.characters || [])
      .map((character) => ({ name: character.name, count: lineCounts[character.name] || 0 }))
      .sort((a, b) => b.count - a.count);
    const max = list[0]?.count || 1;
    const totalSpoken = list.reduce((sum, item) => sum + item.count, 0) || 1;
    return list.map((item, index) => ({
      ...item,
      tier: tierFor(item.count, max),
      color: SPEAKER_PALETTE[index % SPEAKER_PALETTE.length],
      ratio: Math.round((item.count / totalSpoken) * 100),
    }));
  }, [preview, lineCounts]);

  const sceneCount = preview?.scenes?.length || 0;
  const characterCount = preview?.characters?.length || 0;
  const relationCount = preview?.relationships?.length || 0;
  const charCount = scriptText?.length || 0;
  const rowCount = Math.max((scriptText || '').split('\n').length, 1);
  const duration = (preview?.scenes || []).reduce(
    (sum, scene) => sum + (Number(scene.estimatedMinutes) || 0),
    0
  );

  const reviewCount = (preview?.relationships || []).filter((r) => r.needsReview).length;

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
    <div className="cf2">
      <div className="cf2-bg" aria-hidden="true">
        <img src={scriptBg} alt="" />
      </div>
      <div className="cf2-mask" aria-hidden="true" />

      <header className="cf2-hero">
        <div className="cf2-hero-main">
          <span className="cf2-eyebrow">SCRIPT & VERSIONS · 01</span>
          <div className="cf2-hero-title">
            <h1>核对拆解结果</h1>
            <span className="cf2-hero-badge">校对中</span>
          </div>
        </div>
        <div className="cf2-hero-stats">
          <div className="cf2-mini-stat">
            <b>{sceneCount}</b><span>场次</span>
          </div>
          <div className="cf2-mini-stat">
            <b>{characterCount}</b><span>角色</span>
          </div>
          <div className="cf2-mini-stat">
            <b>{charCount}</b><span>字数</span>
          </div>
          <div className="cf2-mini-stat">
            <b>{duration}<small>分钟</small></b><span>时长</span>
          </div>
        </div>
      </header>

      <div className="cf2-grid">
        <section className="cf2-manuscript">
          {showGuide && (
            <div className="cf-guide" role="status">
              <span className="cf-guide-icon">💡</span>
              <p>
                剧本可以<b>直接在下面改</b>：点一下文字就能修改，用上方按钮加场景、加台词，改完点右下角。
              </p>
              <button
                type="button"
                aria-label="关闭引导"
                className="cf-guide-close"
                onClick={() => setShowGuide(false)}
              >
                ✕
              </button>
            </div>
          )}
          <div className="cf2-manuscript-head">
            <b>剧本内容</b>
            <select
              aria-label="幕筛选"
              className="cf-act-select"
              value={actFilter}
              onChange={(event) => setActFilter(event.target.value)}
            >
              <option value="all">全部幕</option>
              {(preview?.acts || []).map((act) => (
                <option key={act.id} value={act.actNumber}>
                  {act.title ? `第${act.actNumber}幕 · ${act.title}` : `第${act.actNumber}幕`}
                </option>
              ))}
            </select>
          </div>
          <HighlightEditor
            value={scriptText}
            onChange={onChangeScriptText}
            characterNames={(preview?.characters || []).map((c) => c.name)}
          />
          <div className="cf2-manuscript-foot">
            <span>第 1 / {sceneCount} 场</span>
            <span>{charCount} 字</span>
            <span>{rowCount} 行</span>
          </div>
        </section>

        <aside className="cf2-aside">
          <div className="cf2-card cf-recognition">
            <span className="field-label">识别结果</span>
            <div className="cf-stat-row">
              <div className="cf-stat">
                <span className="cf-stat-icon">▦</span>
                <div>
                  <small>场次</small>
                  <b>{preview?.scenes?.length || 0}</b>
                </div>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-icon">♙</span>
                <div>
                  <small>角色</small>
                  <b>{preview?.characters?.length || 0}</b>
                </div>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-icon">⌇</span>
                <div>
                  <small>关系</small>
                  <b>{preview?.relationships?.length || 0}</b>
                </div>
              </div>
            </div>

            <div className="cf-roster-head">
              <span>角色名单（{roster.length}）</span>
            </div>
            {roster.length === 0 ? (
              <p className="muted text-xs">暂未识别到角色。</p>
            ) : (
              <ul className="cf-roster">
                {roster.map((item) => (
                  <li key={item.name}>
                    <div className="cf-roster-row">
                      <span className="cf-roster-dot" style={{ backgroundColor: item.color }} />
                      <span className="cf-roster-name">{item.name}</span>
                      <span className="cf-tier">{item.tier}</span>
                      <span className="cf-roster-count">{item.count}</span>
                    </div>
                    <span className="cf-roster-bar" aria-hidden="true">
                      <span
                        className="cf-roster-bar-fill"
                        style={{ width: `${item.ratio}%`, backgroundColor: item.color }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="cf-review-link">
              <span className="cf-review-dot" />
              {reviewCount} 条关系待核实 ›
            </p>
          </div>

          <div className="cf2-card">
            <span className="field-label">结构校对</span>
            <h3>人物别名</h3>
            <p className="muted text-xs">把同一人物的不同称呼合并，避免排演表里出现两套名字。</p>
            <label>
              规范名
              <input
                type="text"
                value={canonical}
                onChange={(event) => setCanonical(event.target.value)}
                className="field"
              />
            </label>
            <label>
              别名
              <input
                type="text"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                className="field"
              />
            </label>
            <button type="button" onClick={handleMerge} className="btn-ghost btn-small">
              合并人物
            </button>
            {notice && <p className="state-done cf2-notice">{notice}</p>}
          </div>

          <div className="cf2-card">
            <span className="field-label">智能增强</span>
            <label className="ai-consent-row">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(event) => onAiEnabledChange?.(event.target.checked)}
              />
              <span>
                <b>允许此作品自动调用文本 AI</b>
                <small className="muted">
                  本地规则始终可用；图片和视频等付费任务仍需逐项确认。
                </small>
              </span>
            </label>
          </div>
        </aside>
      </div>

      {error && (
        <p role="alert" className="alert-error cf2-error">
          {error}
        </p>
      )}

      <div className="cf2-actions">
        {onBack && (
          <button type="button" onClick={onBack} className="btn-ghost cf2-back">
            换一个剧本
          </button>
        )}
        {onOpenCompare && (
          <button type="button" onClick={onOpenCompare} className="btn-ghost">
            版本对照
          </button>
        )}
        {canRegenerate && (
          <button type="button" onClick={onRegenerate} disabled={busy} className="btn-ghost">
            重新生成
          </button>
        )}
        <button type="button" onClick={handleConfirm} disabled={busy} className="btn-seal cf2-confirm">
          {busy ? '处理中…' : '没问题，开始排'}
        </button>
      </div>
    </div>
  );
}
