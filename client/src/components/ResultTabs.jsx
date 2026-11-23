import { useState } from 'react';
import ScheduleTable from './ScheduleTable.jsx';
import RelationGraph from './RelationGraph.jsx';

export default function ResultTabs({ scriptData, onBackToEdit, onChangeScene }) {
  const [tab, setTab] = useState('schedule'); // schedule | relations

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-1.5 text-sm rounded-md ${tab === id ? 'bg-amber-200 text-stone-900' : 'text-stone-300'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-stone-700 p-1">
          {tabBtn('schedule', '排演准备表')}
          {tabBtn('relations', '人物关系图')}
        </div>
        <button onClick={onBackToEdit} className="text-sm text-stone-400 underline">
          返回编辑剧本
        </button>
      </div>

      <div className="mt-6">
        {tab === 'schedule' && <ScheduleTable scriptData={scriptData} onChangeScene={onChangeScene} />}
        {tab === 'relations' && <RelationGraph scriptData={scriptData} />}
      </div>
    </div>
  );
}
