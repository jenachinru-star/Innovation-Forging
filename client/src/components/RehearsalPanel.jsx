import { useState } from 'react';

const IMPACT_ACTIONS = [
  ['accepted', '更新'],
  ['keptOld', '保留旧版'],
  ['dismissed', '暂缓'],
];

export function organizeNotes(text) {
  const decisions = [];
  const openQuestions = [];
  const todos = [];
  const source = typeof text === 'string' ? text : '';

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith('?') || line.endsWith('？')) {
      openQuestions.push(line);
    } else if (line.startsWith('#')) {
      const item = line.replace(/^#+\s*/, '').trim();
      if (item) todos.push({ text: item, done: false });
    } else {
      decisions.push(line);
    }
  }

  return { decisions, openQuestions, todos };
}

function ListSection({ title, testId, items, emptyText }) {
  return (
    <section data-testid={testId} className="card rounded p-3">
      <h4 className="mb-2 text-sm font-medium">{title}</h4>
      {items.length === 0 ? (
        <p className="muted text-xs">{emptyText}</p>
      ) : (
        <ul
          className="zebra overflow-hidden rounded border"
          style={{ borderColor: 'var(--line)' }}
        >
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="border-b px-2 py-1 text-sm" style={{ borderColor: 'var(--line)' }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function RehearsalPanel({ plan, dispatch, scenes }) {
  void scenes;
  const saved = Array.isArray(plan?.rehearsals) && plan.rehearsals[0] ? plan.rehearsals[0] : null;
  const [notes, setNotes] = useState(typeof saved?.notes === 'string' ? saved.notes : '');
  const [organized, setOrganized] = useState(() => ({
    decisions: Array.isArray(saved?.decisions) ? saved.decisions : [],
    openQuestions: Array.isArray(saved?.openQuestions) ? saved.openQuestions : [],
    todos: Array.isArray(saved?.todos) ? saved.todos : [],
  }));

  const impacts = Array.isArray(plan?.impacts) ? plan.impacts : [];

  function persist(next, nextNotes = notes) {
    dispatch?.({
      type: 'setRehearsalNotes',
      payload: {
        notes: nextNotes,
        decisions: next.decisions,
        openQuestions: next.openQuestions,
        todos: next.todos,
      },
    });
  }

  function handleOrganize() {
    const next = organizeNotes(notes);
    setOrganized(next);
    persist(next);
  }

  function toggleTodo(index) {
    const next = {
      ...organized,
      todos: organized.todos.map((todo, i) =>
        i === index ? { ...todo, done: !todo.done } : todo
      ),
    };
    setOrganized(next);
    persist(next);
  }

  return (
    <div data-testid="rehearsal-panel">
      <div>
        <label htmlFor="rehearsal-notes" className="muted mb-1 block text-xs">
          排练笔记
        </label>
        <textarea
          id="rehearsal-notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="每行一条；以？结尾为待确认问题，以 # 开头为待办"
          className="field w-full px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleOrganize}
          className="btn-primary mt-2 px-3 py-1.5 text-sm"
        >
          整理
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <ListSection
          title="决策"
          testId="rehearsal-decisions"
          items={organized.decisions}
          emptyText="暂无决策"
        />
        <ListSection
          title="待确认问题"
          testId="rehearsal-questions"
          items={organized.openQuestions}
          emptyText="暂无待确认问题"
        />
        <section data-testid="rehearsal-todos" className="card rounded p-3">
          <h4 className="mb-2 text-sm font-medium">待办</h4>
          {organized.todos.length === 0 ? (
            <p className="muted text-xs">暂无待办</p>
          ) : (
            <ul
              className="zebra overflow-hidden rounded border"
              style={{ borderColor: 'var(--line)' }}
            >
              {organized.todos.map((todo, index) => (
                <li
                  key={`todo-${index}`}
                  className="border-b px-2 py-1 text-sm"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(index)}
                    />
                    <span className={todo.done ? 'muted line-through' : ''}>
                      {todo.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-medium">影响提示</h3>
        {impacts.length === 0 ? (
          <p className="muted text-xs">暂无影响记录。</p>
        ) : (
          <ul className="space-y-2">
            {impacts.map((impact) => {
              const settled = impact.status && impact.status !== 'open';
              return (
                <li
                  key={impact.id}
                  data-testid={`impact-${impact.id}`}
                  className="card rounded p-3 text-sm"
                >
                  <p className="flex items-start gap-2">
                    <span
                      className={`state-dot mt-1.5 ${settled ? 'state-done' : 'state-open'}`}
                    />
                    <span>{impact.reason}</span>
                  </p>
                  {impact.suggestion && (
                    <p className="muted mt-1 text-xs">建议：{impact.suggestion}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {IMPACT_ACTIONS.map(([status, label]) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          dispatch?.({ type: 'resolveImpact', id: impact.id, status })
                        }
                        className="btn-ghost px-2 py-0.5 text-xs"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
