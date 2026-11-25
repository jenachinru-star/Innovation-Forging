import { useState } from 'react';
import { IMPACT_ACTION_OPTIONS, isImpactSettled } from '@director/shared/constants/status.js';

const IMPACT_ACTIONS = IMPACT_ACTION_OPTIONS;

const TODO_FILTERS = [
  ['all', '全部'],
  ['active', '未完成'],
  ['done', '已完成'],
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

export function buildActivityLog(discussions) {
  const list = Array.isArray(discussions) ? discussions : [];
  return list
    .filter((item) => item && item.id)
    .map((item) => ({
      id: item.id,
      title: item.title || '未命名讨论',
      kind: item.kind === 'audio' ? 'audio' : 'text',
      createdAt: item.createdAt || '',
      status: item.status || 'draft',
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatLogTime(value) {
  if (!value) return '时间未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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
  const [todoFilter, setTodoFilter] = useState('all');
  const [organized, setOrganized] = useState(() => ({
    decisions: Array.isArray(saved?.decisions) ? saved.decisions : [],
    openQuestions: Array.isArray(saved?.openQuestions) ? saved.openQuestions : [],
    todos: Array.isArray(saved?.todos) ? saved.todos : [],
  }));

  const impacts = Array.isArray(plan?.impacts) ? plan.impacts : [];
  const activities = buildActivityLog(plan?.discussions);

  const totalTodos = organized.todos.length;
  const doneTodos = organized.todos.filter((todo) => todo.done).length;
  const percent = totalTodos === 0 ? 0 : Math.round((doneTodos / totalTodos) * 100);
  const visibleTodos = organized.todos.filter((todo) => {
    if (todoFilter === 'active') return !todo.done;
    if (todoFilter === 'done') return todo.done;
    return true;
  });

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
    const realIndex = organized.todos.findIndex(
      (todo) => todo === visibleTodos[index]
    );
    const target = realIndex >= 0 ? realIndex : index;
    const next = {
      ...organized,
      todos: organized.todos.map((todo, i) =>
        i === target ? { ...todo, done: !todo.done } : todo
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
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium">待办</h4>
            <span data-testid="todo-rate" className="muted text-xs">
              {doneTodos}/{totalTodos} · {percent}%
            </span>
          </div>
          <div className="progress-track mb-2" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="filter-group mb-2" role="group" aria-label="待办筛选">
            {TODO_FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={todoFilter === value}
                onClick={() => setTodoFilter(value)}
                className={`filter-chip ${todoFilter === value ? 'is-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          {totalTodos === 0 ? (
            <p className="muted text-xs">暂无待办</p>
          ) : visibleTodos.length === 0 ? (
            <p className="muted text-xs">该筛选下暂无待办</p>
          ) : (
            <ul
              className="zebra overflow-hidden rounded border"
              style={{ borderColor: 'var(--line)' }}
            >
              {visibleTodos.map((todo, index) => (
                <li
                  key={`todo-${todo.text}-${index}`}
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
              const settled = isImpactSettled(impact.status);
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

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-medium">活动日志</h3>
        {activities.length === 0 ? (
          <p className="muted text-xs">暂无讨论或排练活动，可从顶栏「讨论」开始记录。</p>
        ) : (
          <ol data-testid="activity-log" className="timeline">
            {activities.map((activity) => (
              <li key={activity.id} data-testid={`activity-${activity.id}`} className="timeline-item">
                <span className={`timeline-dot ${activity.kind === 'audio' ? 'is-audio' : 'is-text'}`} />
                <div className="timeline-body">
                  <p className="text-sm">
                    {activity.title}
                    <span className="muted ml-2 text-xs">
                      {activity.kind === 'audio' ? '录音讨论' : '文字讨论'}
                    </span>
                  </p>
                  <small className="muted">{formatLogTime(activity.createdAt)}</small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
