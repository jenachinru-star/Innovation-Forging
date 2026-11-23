import { useState } from 'react';
import ScheduleTable from './ScheduleTable.jsx';
import CadencePanel from './CadencePanel.jsx';
import RelationGraph from './RelationGraph.jsx';
import CharacterGallery from './CharacterGallery.jsx';
import StageBlocking from './StageBlocking.jsx';
import BriefPanel from './BriefPanel.jsx';
import RehearsalPanel from './RehearsalPanel.jsx';
import ExportPanel from './ExportPanel.jsx';
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

export default function ResultTabs({
  scriptData,
  onBackToEdit,
  onChangeScene,
  source,
  briefs = [],
  plan,
  dispatch,
}) {
  const [tab, setTab] = useState('schedule'); // schedule | relations | gallery | briefs | rehearsal | export
  const scenes = scriptData?.scenes || [];
  const [stageSceneNumber, setStageSceneNumber] = useState(scenes[0]?.sceneNumber ?? 1);
  const stageScene =
    scenes.find((scene) => Number(scene?.sceneNumber) === Number(stageSceneNumber)) ||
    scenes[0] ||
    null;
  const scriptCharacters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];
  const sceneNames =
    (Array.isArray(stageScene?.presentCharacters) && stageScene.presentCharacters.length > 0
      ? stageScene.presentCharacters
      : stageScene?.characters) || [];
  const characterByName = new Map(
    scriptCharacters.filter((character) => character && character.name).map((character) => [character.name, character])
  );
  const stageCharacters =
    sceneNames.length > 0
      ? sceneNames.map((name) => characterByName.get(name) || { id: `ch-${name}`, name })
      : scriptCharacters;

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-md px-4 py-1.5 text-sm ${tab === id ? 'btn-primary' : 'muted'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {sourceLabel(source) && (
        <p className="muted mb-3 text-xs">{sourceLabel(source)}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="hairline inline-flex rounded-lg p-1">
          {tabBtn('schedule', '排演准备表')}
          {tabBtn('relations', '人物关系图')}
          {tabBtn('gallery', '角色海报')}
          {tabBtn('briefs', '需求转译')}
          {tabBtn('rehearsal', '排练与影响')}
          {tabBtn('export', '导出')}
        </div>
        <button onClick={onBackToEdit} className="muted text-sm underline">
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
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium">走位示意</h3>
                {scenes.length > 0 && (
                  <>
                    <label htmlFor="stage-scene" className="muted text-xs">
                      走位场次
                    </label>
                    <select
                      id="stage-scene"
                      value={stageSceneNumber}
                      onChange={(e) => setStageSceneNumber(Number(e.target.value))}
                      className="field px-2 py-0.5 text-xs"
                    >
                      {scenes.map((scene) => (
                        <option key={scene.id || scene.sceneNumber} value={scene.sceneNumber}>
                          {scene.title || `第 ${scene.sceneNumber} 场`}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <StageBlocking
                characters={stageCharacters}
                scenes={scenes}
                sceneNumber={stageSceneNumber}
                plan={plan}
                dispatch={dispatch}
              />
            </div>
          </>
        )}
        {tab === 'relations' && <RelationGraph scriptData={scriptData} />}
        {tab === 'gallery' && <CharacterGallery characters={scriptData.characters} />}
        {tab === 'briefs' && (
          <BriefPanel scenes={scriptData?.scenes || []} plan={plan} dispatch={dispatch} />
        )}
        {tab === 'rehearsal' && (
          <RehearsalPanel
            scenes={scenes}
            plan={plan}
            dispatch={dispatch}
          />
        )}
        {tab === 'export' && (
          <ExportPanel
            title={plan?.name || '舞台方案'}
            scriptData={scriptData}
            plan={plan}
          />
        )}
      </div>
    </div>
  );
}
