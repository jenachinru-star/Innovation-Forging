import { useEffect, useState } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  X,
  MessageSquare,
  Loader,
  Trash2,
  RotateCcw,
  ListChecks,
  ArrowRight,
  Bot,
  Check,
} from 'lucide-react';
import useRecorder, { formatClock } from '../hooks/useRecorder.js';
import { nextId } from '../store/plan.js';
import { splitBrief } from '@director/shared/rules/briefs.js';
import { DISCUSSION_STATUS } from '@director/shared/constants/status.js';
import { SAMPLE_DISCUSSION } from '../data/sampleDiscussion.js';
import CollectionPanel from './CollectionPanel.jsx';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const TABS = [
  { id: 'record', label: '语音记录', icon: Mic },
  { id: 'minutes', label: 'AI 纪要', icon: Bot },
  { id: 'todos', label: '待办清单', icon: ListChecks },
];

function DiscussionComposer({ recorder, mode, setMode, onSubmitAudio, onSubmitText, busy }) {
  const [text, setText] = useState('');

  if (mode === 'text') {
    return (
      <div className="disc-composer">
        <textarea
          className="field disc-textarea"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="记录想法、需求更改或讨论结论，AI 会帮你梳理成决策 / 待办 / 变更 / 问题"
        />
        <div className="disc-composer-actions">
          <button type="button" className="btn-ghost btn-small" onClick={() => setMode('menu')}>
            返回
          </button>
          <button
            type="button"
            className="btn-seal btn-small"
            disabled={busy || !text.trim()}
            onClick={() => onSubmitText(text.trim())}
          >
            提交并梳理
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'record') {
    const recording = recorder.status === 'recording';
    const paused = recorder.status === 'paused';
    if (!recorder.supported) {
      return (
        <div className="disc-composer disc-unsupported">
          <Mic size={22} />
          <p>当前环境不支持录音，需在 https 或 localhost 安全上下文下使用。</p>
          <button type="button" className="btn-seal btn-small" onClick={() => setMode('text')}>
            改用文字记录
          </button>
        </div>
      );
    }
    return (
      <div className="disc-composer disc-recorder">
        <div className={`disc-recorder-dial ${recorder.status !== 'idle' ? 'is-live' : ''}`}>
          <span className="disc-timer">{formatClock(recorder.seconds)}</span>
          <span className="disc-recorder-state">
            {recording ? '录音中' : paused ? '已暂停' : '准备就绪'}
          </span>
        </div>

        {recorder.error && <p className="disc-error">{recorder.error}</p>}

        <div className="disc-recorder-controls">
          {recorder.status === 'idle' && (
            <button type="button" className="disc-mic-btn" aria-label="开始录音" onClick={recorder.start}>
              <Mic size={22} />
            </button>
          )}
          {recorder.status !== 'idle' && (
            <>
              <button
                type="button"
                className="disc-ctrl-btn"
                aria-label={paused ? '继续' : '暂停'}
                onClick={paused ? recorder.resume : recorder.pause}
              >
                {paused ? <Play size={17} /> : <Pause size={17} />}
              </button>
              <button
                type="button"
                className="disc-mic-btn is-stop"
                aria-label="停止并转写"
                onClick={() => onSubmitAudio(recorder)}
              >
                <Square size={20} />
              </button>
              <button type="button" className="disc-ctrl-btn" aria-label="放弃重录" onClick={recorder.cancel}>
                <RotateCcw size={17} />
              </button>
            </>
          )}
        </div>
        <p className="disc-hint">停止后自动转写并生成结构化纪要</p>
      </div>
    );
  }

  return (
    <div className="disc-mode-menu">
      <button type="button" className="disc-mode-card" onClick={() => setMode('record')}>
        <Mic size={20} />
        <span>
          <b>录音讨论</b>
          <small>现场会议、口头沟通，录下后转写纪要</small>
        </span>
      </button>
      <button type="button" className="disc-mode-card" onClick={() => setMode('text')}>
        <MessageSquare size={20} />
        <span>
          <b>文字记录</b>
          <small>直接输入想法、需求更改或讨论结论</small>
        </span>
      </button>
    </div>
  );
}

export default function DiscussionPanel({ open, onClose, plan, dispatch }) {
  const recorder = useRecorder();
  const [tab, setTab] = useState('record');
  const [composerMode, setComposerMode] = useState('menu');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(new Set());

  const discussions = Array.isArray(plan?.discussions) ? plan.discussions : [];

  function toggleChecked(key) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 关闭面板时若仍在录音，先放弃并复位
  useEffect(() => {
    if (!open && recorder.status !== 'idle') recorder.cancel();
    if (!open) {
      setComposerMode('menu');
      setTab('record');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function analyze(payload) {
    let res;
    try {
      res = await fetch('/api/discussion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('无法连接服务：AI 梳理需联网或后端支持，可先查看历史或加载示例');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '分析失败，请稍后再试');
    return data;
  }

  async function submitAudio(rec) {
    if (busy) return;
    const result = await rec.stop();
    if (!result) return;
    setBusy(true);
    setError('');
    const id = nextId('disc', discussions);
    dispatch({
      type: 'addDiscussion',
      discussion: {
        id,
        kind: 'audio',
        title: `录音讨论 · ${formatClock(rec.seconds)}`,
        durationSec: rec.seconds,
        audioUrl: result.url,
        status: DISCUSSION_STATUS.PROCESSING,
      },
    });
    try {
      const audioData = await blobToBase64(result.blob);
      const data = await analyze({
        kind: 'audio',
        audioData,
        audioFormat: result.type,
        durationSec: rec.seconds,
      });
      dispatch({
        type: 'updateDiscussion',
        id,
        patch: { transcript: data.transcript, summary: data.summary, status: DISCUSSION_STATUS.DONE },
      });
      setComposerMode('menu');
    } catch (e) {
      setError(String(e?.message || e));
      dispatch({ type: 'updateDiscussion', id, patch: { status: DISCUSSION_STATUS.ERROR } });
    } finally {
      setBusy(false);
    }
  }

  async function submitText(text) {
    if (busy) return;
    setBusy(true);
    setError('');
    const id = nextId('disc', discussions);
    dispatch({
      type: 'addDiscussion',
      discussion: { id, kind: 'text', title: text.slice(0, 12), transcript: text, status: DISCUSSION_STATUS.PROCESSING },
    });
    try {
      const data = await analyze({ kind: 'text', text });
      dispatch({
        type: 'updateDiscussion',
        id,
        patch: { summary: data.summary, status: DISCUSSION_STATUS.DONE },
      });
      setComposerMode('menu');
    } catch (e) {
      setError(String(e?.message || e));
      dispatch({ type: 'updateDiscussion', id, patch: { status: DISCUSSION_STATUS.ERROR } });
    } finally {
      setBusy(false);
    }
  }

  function convertTodos(item) {
    const todos = Array.isArray(item.summary?.todos) ? item.summary.todos : [];
    if (!todos.length || item.converted?.todos) return;

    const first = Array.isArray(plan.rehearsals) ? plan.rehearsals[0] : null;
    const currentTodos = Array.isArray(first?.todos) ? first.todos : [];
    const existing = new Set(currentTodos.map((t) => t?.text));
    const merged = [...currentTodos];
    for (const text of todos) {
      if (!existing.has(text)) {
        merged.push({ text, done: false });
        existing.add(text);
      }
    }
    dispatch({
      type: 'setRehearsalNotes',
      payload: {
        notes: first?.notes ?? '',
        decisions: first?.decisions ?? [],
        openQuestions: first?.openQuestions ?? [],
        todos: merged,
      },
    });
    dispatch({
      type: 'updateDiscussion',
      id: item.id,
      patch: { converted: { ...item.converted, todos: true } },
    });
  }

  function convertChanges(item) {
    const changes = Array.isArray(item.summary?.changes) ? item.summary.changes : [];
    if (!changes.length || item.converted?.changes) return;

    const existing = new Set((Array.isArray(plan.briefs) ? plan.briefs : []).map((b) => b?.original));
    for (const change of changes) {
      for (const brief of splitBrief(change)) {
        if (!existing.has(brief.original)) {
          dispatch({ type: 'addBrief', brief });
          existing.add(brief.original);
        }
      }
    }
    dispatch({
      type: 'updateDiscussion',
      id: item.id,
      patch: { converted: { ...item.converted, changes: true } },
    });
  }

  function loadSampleDiscussion() {
    dispatch({ type: 'addDiscussion', discussion: { ...SAMPLE_DISCUSSION } });
  }

  function removeDiscussion(id) {
    if (window.confirm('删除这条讨论记录？')) {
      dispatch({ type: 'removeDiscussion', id });
    }
  }

  const totalTodos = discussions.reduce(
    (sum, item) => sum + (Array.isArray(item.summary?.todos) ? item.summary.todos.length : 0),
    0
  );

  return (
    <>
      <div className={`disc-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`disc-drawer ${open ? 'is-open' : ''}`} aria-label="讨论与复盘" aria-hidden={!open}>
        <header className="disc-header">
          <div>
            <h2>讨论与复盘</h2>
            <p>记录想法与需求变更，AI 自动梳理纪要</p>
          </div>
          <button type="button" className="disc-close" aria-label="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <nav className="disc-tabs" role="tablist" aria-label="讨论视图">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`disc-tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className="disc-body">
          {error && <p className="disc-error">{error}</p>}
          {busy && (
            <p className="disc-processing">
              <Loader size={14} className="disc-spin" /> 正在转写与梳理，请稍候……
            </p>
          )}

          {/* ===== 语音记录：录音/文字入口 + 转写气泡 ===== */}
          {tab === 'record' && (
            <div className="disc-pane">
              <DiscussionComposer
                recorder={recorder}
                mode={composerMode}
                setMode={setComposerMode}
                onSubmitAudio={submitAudio}
                onSubmitText={submitText}
                busy={busy}
              />

              <div className="disc-bubble-list">
                <div className="disc-history-head">
                  <h3 className="disc-history-title">
                    <MessageSquare size={15} /> 转写记录（{discussions.length}）
                  </h3>
                  <button type="button" className="disc-sample-btn" onClick={loadSampleDiscussion}>
                    加载示例
                  </button>
                </div>

                {discussions.length === 0 ? (
                  <p className="disc-empty">还没有讨论记录，从上方开始一条吧。</p>
                ) : (
                  discussions.map((item) => (
                    <div
                      key={item.id}
                      className="disc-bubble"
                      data-kind={item.kind}
                      data-testid={`disc-item-${item.id}`}
                    >
                      <span className="disc-bubble-avatar" aria-hidden>
                        {item.kind === 'audio' ? <Mic size={15} /> : <MessageSquare size={15} />}
                      </span>
                      <div className="disc-bubble-body">
                        <div className="disc-bubble-meta">
                          <b>{item.title}</b>
                          <small>
                            {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}
                            {item.kind === 'audio' && ` · ${formatClock(item.durationSec)}`}
                          </small>
                          <button
                            type="button"
                            className="disc-bubble-delete"
                            aria-label="删除"
                            onClick={() => removeDiscussion(item.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {item.audioUrl && <audio controls src={item.audioUrl} className="disc-audio" />}
                        {item.status === DISCUSSION_STATUS.PROCESSING && (
                          <p className="disc-item-state">分析中……</p>
                        )}
                        {item.status === DISCUSSION_STATUS.ERROR && (
                          <p className="disc-item-state is-error">分析失败</p>
                        )}
                        {item.transcript && <p className="disc-bubble-text">{item.transcript}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ===== AI 纪要：概览 / 决策 / 变更 / 问题 ===== */}
          {tab === 'minutes' && (
            <div className="disc-pane">
              {discussions.every((item) => !item.summary) ? (
                <p className="disc-empty">还没有 AI 纪要，先在「语音记录」里发起一条讨论。</p>
              ) : (
                discussions.map((item) => {
                  const s = item.summary;
                  if (!s) return null;
                  const hasChanges = (s.changes || []).length > 0;
                  return (
                    <article key={item.id} className="ai-minutes-card" data-testid={`minutes-${item.id}`}>
                      <div className="ai-minutes-head">
                        <Bot size={16} aria-hidden />
                        <b>{item.title}</b>
                      </div>
                      {s.overview && <p className="ai-minutes-overview">{s.overview}</p>}

                      {[(s.decisions || []).length, (s.changes || []).length, (s.questions || []).length].every(
                        (n) => n === 0
                      ) && <p className="disc-empty">本次暂无结构化条目。</p>}

                      {(s.decisions || []).length > 0 && (
                        <div className="disc-summary-group">
                          <span className="disc-summary-tag tag-decisions">决策</span>
                          <ul className="ai-minutes-list">
                            {s.decisions.map((entry, i) => (
                              <li key={i}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {hasChanges && (
                        <div className="disc-summary-group">
                          <span className="disc-summary-tag tag-changes">变更</span>
                          <div className="disc-summary-content">
                            <ul className="ai-minutes-list">
                              {s.changes.map((entry, i) => (
                                <li key={i}>{entry}</li>
                              ))}
                            </ul>
                            {item.converted?.changes ? (
                              <span className="disc-convert is-done">
                                <ArrowRight size={13} /> 已转入部门需求
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="disc-convert"
                                onClick={() => convertChanges(item)}
                              >
                                <ArrowRight size={13} /> 转为部门需求
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {(s.questions || []).length > 0 && (
                        <div className="disc-summary-group">
                          <span className="disc-summary-tag tag-questions">问题</span>
                          <ul className="ai-minutes-list">
                            {s.questions.map((entry, i) => (
                              <li key={i}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* ===== 待办清单：勾选 + 转排练 ===== */}
          {tab === 'todos' && (
            <div className="disc-pane">
              {totalTodos === 0 ? (
                <p className="disc-empty">还没有待办，AI 梳理后会出现在这里。</p>
              ) : (
                discussions.map((item) => {
                  const todos = Array.isArray(item.summary?.todos) ? item.summary.todos : [];
                  if (!todos.length) return null;
                  return (
                    <div key={item.id} className="todo-group" data-testid={`todos-${item.id}`}>
                      <div className="todo-group-head">
                        <b>{item.title}</b>
                        {item.converted?.todos ? (
                          <span className="disc-convert is-done">
                            <ListChecks size={13} /> 已转入排练待办
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="disc-convert"
                            onClick={() => convertTodos(item)}
                          >
                            <ListChecks size={13} /> 转为排练待办
                          </button>
                        )}
                      </div>
                      <ul className="todo-check-list">
                        {todos.map((entry, i) => {
                          const key = `${item.id}:${i}`;
                          const isDone = checked.has(key);
                          return (
                            <li key={key}>
                              <button
                                type="button"
                                className={`todo-check ${isDone ? 'is-checked' : ''}`}
                                aria-pressed={isDone}
                                onClick={() => toggleChecked(key)}
                              >
                                {isDone && <Check size={12} aria-hidden />}
                              </button>
                              <span className={isDone ? 'is-done-text' : ''}>{entry}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}

              <CollectionPanel plan={plan} dispatch={dispatch} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
