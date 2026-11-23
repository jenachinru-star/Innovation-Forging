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

const EMPTY_ORGANIZED = { decisions: [], openQuestions: [], todos: [] };

function ListSection({ title, testId, items, emptyText }) {
  return (
    <section data-testid={testId} className="rounded border border-stone-700 p-3">
      <h4 className="mb-2 text-sm font-medium text-stone-300">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-stone-500">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-sm text-stone-200">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function RehearsalPanel({ plan, dispatch, scenes, onChange }) {
  void scenes;
  const [notes, setNotes] = useState('');
  const [organized, setOrganized] = useState(EMPTY_ORGANIZED);

  const impacts = Array.isArray(plan?.impacts) ? plan.impacts : [];

  function handleOrganize() {
    const next = organizeNotes(notes);
    setOrganized(next);
    onChange?.(next);
  }

  function toggleTodo(index) {
    setOrganized((prev) => ({
      ...prev,
      todos: prev.todos.map((todo, i) =>
        i === index ? { ...todo, done: !todo.done } : todo
      ),
    }));
  }

  return (
    <div data-testid="rehearsal-panel">
      <div>
        <label htmlFor="rehearsal-notes" className="mb-1 block text-xs text-stone-400">
          排练笔记
        </label>
        <textarea
          id="rehearsal-notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="每行一条；以？结尾为待确认问题，以 # 开头为待办"
          className="w-full rounded border border-stone-600 bg-stone-900 px-2 py-1 text-sm text-stone-200"
        />
        <button
          type="button"
          onClick={handleOrganize}
          className="mt-2 rounded-md bg-amber-200 px-3 py-1.5 text-sm text-stone-900"
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
        <section data-testid="rehearsal-todos" className="rounded border border-stone-700 p-3">
          <h4 className="mb-2 text-sm font-medium text-stone-300">待办</h4>
          {organized.todos.length === 0 ? (
            <p className="text-xs text-stone-500">暂无待办</p>
          ) : (
            <ul className="space-y-1">
              {organized.todos.map((todo, index) => (
                <li key={`todo-${index}`} className="text-sm text-stone-200">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(index)}
                    />
                    <span className={todo.done ? 'text-stone-500 line-through' : ''}>
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
        <h3 className="mb-2 text-sm font-medium text-stone-300">影响提示</h3>
        {impacts.length === 0 ? (
          <p className="text-xs text-stone-500">暂无影响记录。</p>
        ) : (
          <ul className="space-y-2">
            {impacts.map((impact) => (
              <li
                key={impact.id}
                data-testid={`impact-${impact.id}`}
                className="rounded border border-stone-700 p-3 text-sm text-stone-200"
              >
                <p>{impact.reason}</p>
                {impact.suggestion && (
                  <p className="mt-1 text-xs text-stone-400">建议：{impact.suggestion}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {IMPACT_ACTIONS.map(([status, label]) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        dispatch?.({ type: 'resolveImpact', id: impact.id, status })
                      }
                      className="rounded border border-stone-600 px-2 py-0.5 text-xs text-stone-200"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
