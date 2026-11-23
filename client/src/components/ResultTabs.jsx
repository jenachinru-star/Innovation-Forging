import { useState } from 'react';
import ScheduleTable from './ScheduleTable.jsx';
import CadencePanel from './CadencePanel.jsx';
import RelationGraph from './RelationGraph.jsx';
import CharacterGallery from './CharacterGallery.jsx';
import StageBlocking from './StageBlocking.jsx';
import { getSourceMode } from '../engine/index.js';

const SOURCE_LABELS = {
  sample: '来源：样例剧本',
  upload: '来源：导入剧本',
  generate: '来源：AI 生成',
};

function sourceLabel(source) {
  const base = SOURCE_LABELS[source];
  if (!base) return '';
  return getSourceMode() === 'local' ? `${base} · 仅本地处理` : base;
}

export default function ResultTabs({ scriptData, onBackToEdit, onChangeScene, source, briefs = [] }) {
  const [tab, setTab] = useState('schedule'); // schedule | relations | gallery

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
      {sourceLabel(source) && (
        <p className="mb-3 text-xs text-stone-500">{sourceLabel(source)}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-stone-700 p-1">
          {tabBtn('schedule', '排演准备表')}
          {tabBtn('relations', '人物关系图')}
          {tabBtn('gallery', '角色海报')}
        </div>
        <button onClick={onBackToEdit} className="text-sm text-stone-400 underline">
          返回编辑剧本
        </button>
      </div>

      <div className="mt-6">
        {tab === 'schedule' && (
          <>
            <ScheduleTable scriptData={scriptData} onChangeScene={onChangeScene} />
            <div className="mt-8">
              <CadencePanel
                scenes={scriptData?.scenes || []}
                briefs={briefs}
                onChange={onChangeScene}
              />
            </div>
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-medium text-stone-300">走位示意</h3>
              <StageBlocking characters={scriptData?.scenes?.[0]?.characters || []} />
            </div>
          </>
        )}
        {tab === 'relations' && <RelationGraph scriptData={scriptData} />}
        {tab === 'gallery' && <CharacterGallery characters={scriptData.characters} />}
      </div>
    </div>
  );
}
