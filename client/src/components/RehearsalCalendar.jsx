import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin } from 'lucide-react';
import { buildCalendarMatrix } from '@director/shared/rules/coreDesk.js';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function toLocalDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function RehearsalCalendar({ plan, dispatch }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ location: '', notes: '' });

  const rehearsals = Array.isArray(plan?.rehearsals) ? plan.rehearsals : [];
  const byDate = useMemo(() => {
    const map = new Map();
    for (const r of rehearsals) {
      if (!r.date) continue;
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date).push(r);
    }
    return map;
  }, [rehearsals]);

  const matrix = buildCalendarMatrix(view.year, view.month);
  const todayStr = toLocalDateString(new Date());

  function shiftMonth(delta) {
    setView((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  const selectedRehearsals = selectedDate ? byDate.get(selectedDate) || [] : [];

  function addRehearsal() {
    if (!selectedDate) return;
    dispatch({
      type: 'addRehearsal',
      rehearsal: {
        date: selectedDate,
        location: form.location,
        notes: form.notes ? [form.notes] : [],
        castIds: [],
        decisions: [],
        openQuestions: [],
        todos: [],
      },
    });
    setForm({ location: '', notes: '' });
  }

  return (
    <div className="rehearsal-calendar" data-testid="rehearsal-calendar">
      <div className="cal-head">
        <h3>
          {view.year} 年 {view.month + 1} 月
        </h3>
        <div className="cal-nav">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="上一月">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="下一月">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="cal-grid">
        {matrix.map((cell, index) => {
          const items = cell.date ? byDate.get(cell.date) || [] : [];
          return (
            <button
              key={cell.date || `out-${index}`}
              type="button"
              className={`cal-cell ${cell.inMonth ? '' : 'is-out'} ${
                cell.date === todayStr ? 'is-today' : ''
              } ${cell.date === selectedDate ? 'is-selected' : ''}`}
              disabled={!cell.inMonth}
              onClick={() => setSelectedDate(cell.date)}
            >
              <span className="cal-day">{cell.day}</span>
              {items.map((r) => (
                <span key={r.id} className="cal-mark">
                  <MapPin size={10} aria-hidden /> {r.location || '排练'}
                </span>
              ))}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="cal-detail" data-testid="cal-detail">
          <h4>{selectedDate}</h4>
          {selectedRehearsals.length === 0 ? (
            <p className="muted">当天暂无排练安排。</p>
          ) : (
            <ul>
              {selectedRehearsals.map((r) => (
                <li key={r.id}>
                  <MapPin size={12} aria-hidden /> {r.location || '未填地点'}
                  {r.notes?.length ? ` · ${r.notes.join('；')}` : ''}
                </li>
              ))}
            </ul>
          )}
          <div className="cal-form">
            <input
              placeholder="排练地点"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              aria-label="排练地点"
            />
            <input
              placeholder="备注"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              aria-label="备注"
            />
            <button type="button" className="btn-seal" onClick={addRehearsal}>
              <Plus size={14} aria-hidden /> 添加排练
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
