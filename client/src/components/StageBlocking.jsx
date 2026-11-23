import { useState } from 'react';

const POSITIONS = [
  { left: '15%', top: '70%' },
  { left: '50%', top: '30%' },
  { left: '80%', top: '70%' },
  { left: '35%', top: '55%' },
];

export default function StageBlocking({ characters }) {
  const [step, setStep] = useState(0);
  const actors = (characters || []).slice(0, 4);

  return (
    <div>
      <div className="relative h-56 w-full rounded-lg border border-stone-700 bg-gradient-to-b from-stone-800 to-stone-900">
        <div className="absolute inset-x-6 bottom-6 h-px bg-amber-200/40" />
        {actors.map((name, i) => {
          const p = POSITIONS[(i + step) % POSITIONS.length];
          return (
            <div
              key={name}
              style={{ left: p.left, top: p.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 px-2 py-1 text-xs text-stone-900 transition-all duration-700"
            >
              {name}
            </div>
          );
        })}
      </div>
      <button onClick={() => setStep((s) => s + 1)} className="mt-2 rounded border border-stone-600 px-3 py-1 text-xs text-stone-200">
        下一走位
      </button>
    </div>
  );
}
