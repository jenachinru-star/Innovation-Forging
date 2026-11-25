import { useEffect, useState } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  X,
  MessageSquare,
  StickyNote,
  Loader,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import useRecorder, { formatClock } from '../hooks/useRecorder.js';
import { nextId } from '../store/plan.js';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
  const [mode, setMode] = useState('menu');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const discussions = Array.isArray(plan?.discussions) ? plan.discussions : [];

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
    if (!open) setMode('menu');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function analyze(payload) {
    const res = await fetch('/api/discussion/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
        status: 'processing',
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
        patch: { transcript: data.transcript, summary: data.summary, status: 'done' },
      });
      setMode('menu');
    } catch (e) {
      setError(String(e?.message || e));
      dispatch({ type: 'updateDiscussion', id, patch: { status: 'error' } });
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
      discussion: { id, kind: 'text', title: text.slice(0, 12), transcript: text, status: 'processing' },
    });
    try {
      const data = await analyze({ kind: 'text', text });
      dispatch({
        type: 'updateDiscussion',
        id,
        patch: { summary: data.summary, status: 'done' },
      });
      setMode('menu');
    } catch (e) {
      setError(String(e?.message || e));
      dispatch({ type: 'updateDiscussion', id, patch: { status: 'error' } });
    } finally {
      setBusy(false);
    }
  }

  function removeDiscussion(id) {
    if (window.confirm('删除这条讨论记录？')) {
      dispatch({ type: 'removeDiscussion', id });
    }
  }

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

        <div className="disc-body">
          <DiscussionComposer
            recorder={recorder}
            mode={mode}
            setMode={setMode}
            onSubmitAudio={submitAudio}
            onSubmitText={submitText}
            busy={busy}
          />

          {error && <p className="disc-error">{error}</p>}
          {busy && (
            <p className="disc-processing">
              <Loader size={14} className="disc-spin" /> 正在转写与梳理，请稍候……
            </p>
          )}

          <div className="disc-history">
            <h3 className="disc-history-title">
              <StickyNote size={15} /> 历史讨论（{discussions.length}）
            </h3>
            {discussions.length === 0 ? (
              <p className="disc-empty">还没有讨论记录，从上方开始一条吧。</p>
            ) : (
              discussions.map((item) => (
                <article key={item.id} className="disc-item" data-testid={`disc-item-${item.id}`}>
                  <div className="disc-item-head">
                    <b>{item.title}</b>
                    <button
                      type="button"
                      className="disc-item-delete"
                      aria-label="删除"
                      onClick={() => removeDiscussion(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="disc-item-meta">
                    {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}
                    {item.kind === 'audio' && ` · 时长 ${formatClock(item.durationSec)}`}
                  </p>
                  {item.audioUrl && (
                    <audio controls src={item.audioUrl} className="disc-audio" />
                  )}
                  {item.transcript && (
                    <p className="disc-transcript">{item.transcript}</p>
                  )}
                  {item.status === 'processing' && <p className="disc-item-state">分析中……</p>}
                  {item.status === 'error' && <p className="disc-item-state is-error">分析失败</p>}
                  {item.summary?.overview && (
                    <div className="disc-summary">
                      <p className="disc-summary-overview">{item.summary.overview}</p>
                      {['decisions', 'todos', 'changes', 'questions'].map((key) =>
                        (item.summary[key] || []).length ? (
                          <div key={key} className="disc-summary-group">
                            <span className={`disc-summary-tag tag-${key}`}>
                              { { decisions: '决策', todos: '待办', changes: '变更', questions: '问题' }[key] }
                            </span>
                            <ul>
                              {item.summary[key].map((entry, i) => (
                                <li key={i}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
