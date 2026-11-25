import { useState } from 'react';

const FIELDS = [
  ['goal', '本次目标'],
  ['wentWell', '做得好的'],
  ['improve', '待改进'],
  ['nextActions', '下次行动'],
  ['conclusion', '结论'],
];

export function emptyReview() {
  return { goal: '', wentWell: '', improve: '', nextActions: '', conclusion: '' };
}

export default function ReviewTemplate({ plan, dispatch }) {
  const saved = plan?.review;
  const [form, setForm] = useState(() => ({
    ...emptyReview(),
    ...(saved && typeof saved === 'object' ? saved : {}),
  }));
  const [savedTip, setSavedTip] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedTip(false);
  }

  function handleSave() {
    dispatch?.({ type: 'setReview', payload: form });
    setSavedTip(true);
  }

  return (
    <section data-testid="review-template" className="card rounded p-4">
      <h3 className="mb-1 text-sm font-medium">复盘模板</h3>
      <p className="muted mb-3 text-xs">手动填写，与 AI 讨论纪要互补；保存后随项目归档。</p>
      <div className="review-grid">
        {FIELDS.map(([key, label]) => (
          <div key={key} className={key === 'conclusion' ? 'review-wide' : ''}>
            <label htmlFor={`review-${key}`} className="muted mb-1 block text-xs">
              {label}
            </label>
            <textarea
              id={`review-${key}`}
              rows={3}
              value={form[key]}
              onChange={(event) => update(key, event.target.value)}
              className="field w-full px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={handleSave} className="btn-primary px-3 py-1.5 text-sm">
          保存复盘
        </button>
        {savedTip && (
          <span data-testid="review-saved" className="muted text-xs">
            已保存
          </span>
        )}
      </div>
    </section>
  );
}
