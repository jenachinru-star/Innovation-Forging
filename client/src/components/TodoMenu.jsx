import { useEffect, useRef, useState } from 'react';
import { ListTodo } from 'lucide-react';
import { buildTodos } from '@director/shared/rules/todos.js';

export default function TodoMenu({ plan, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const todos = buildTodos(plan);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="todo-menu" ref={ref}>
      <button
        type="button"
        className="btn-ghost btn-small todo-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ListTodo size={15} aria-hidden />
        待办
        <span className="todo-badge" data-testid="todo-badge">
          {todos.length}
        </span>
      </button>
      {open && (
        <div className="todo-dropdown" role="menu">
          <div className="todo-dropdown-head">待办事项 · {todos.length}</div>
          {todos.map((todo) => (
            <button
              key={todo.id}
              type="button"
              role="menuitem"
              className="todo-item"
              onClick={() => {
                setOpen(false);
                onNavigate(todo.id);
              }}
            >
              <span className="todo-item-text">
                <b>{todo.label}</b>
                <small>{todo.meta}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
