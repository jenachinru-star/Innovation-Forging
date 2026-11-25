import { useState } from 'react';
import ScheduleTable from './ScheduleTable.jsx';
import CadencePanel from './CadencePanel.jsx';
import RelationGraph from './RelationGraph.jsx';
import CharacterGallery from './CharacterGallery.jsx';
import StageBlocking from './StageBlocking.jsx';
import BriefPanel from './BriefPanel.jsx';
import RehearsalPanel from './RehearsalPanel.jsx';
import ReviewTemplate from './ReviewTemplate.jsx';
import ExportPanel from './ExportPanel.jsx';
import VisualStudio from './VisualStudio.jsx';
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
  activeTab,
  onTabChange,
  showTabs = true,
}) {
  const [internalTab, setInternalTab] = useState('schedule');
  const tab = activeTab || internalTab;
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

  function selectTab(id) {
    setInternalTab(id);
    onTabChange?.(id);
  }

  const tabBtn = (id, label, marker) => (
    <button
      type="button"
      onClick={() => selectTab(id)}
      className={`workspace-tab ${tab === id ? 'is-active' : ''}`}
      aria-current={tab === id ? 'page' : undefined}
    >
      {marker && <span className="workspace-tab-mark">{marker}</span>}
      {label}
    </button>
  );

  return (
    <div className="workspace-content">
      {sourceLabel(source) && (
        <p className="source-label">{sourceLabel(source)}</p>
      )}
      <div className="workspace-toolbar">
        <div>
          <span className="eyebrow">制作工作区</span>
          <h2 className="workspace-title">
            {tab === 'schedule' && '拆解与排演准备'}
            {tab === 'stage' && '走位与技术提示'}
            {tab === 'relations' && '人物与关系'}
            {tab === 'gallery' && '角色视觉资产'}
            {tab === 'briefs' && '部门需求'}
            {tab === 'rehearsal' && '排练与影响'}
            {tab === 'visuals' && '视觉制作'}
            {tab === 'export' && '交付'}
          </h2>
        </div>
        <button type="button" onClick={onBackToEdit} className="text-action">
          返回编辑剧本
        </button>
      </div>

      {showTabs && (
        <nav className="workspace-tabs" aria-label="制作工作区">
          {tabBtn('schedule', '排演准备表', '01')}
          {tabBtn('stage', '走位与提示', '02')}
          {tabBtn('relations', '人物关系图', '03')}
          {tabBtn('gallery', '角色海报', '04')}
          {tabBtn('briefs', '需求转译', '05')}
          {tabBtn('rehearsal', '排练与影响', '06')}
          {tabBtn('visuals', '视觉制作', '07')}
          {tabBtn('export', '导出', '08')}
        </nav>
      )}

      <div className="workspace-stage">
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
          </>
        )}
        {tab === 'stage' && (
          <>
            <div className="stage-page-head">
              <div>
                <span className="field-label">排演台</span>
                <p>位置、演员与提示共用同一场次坐标；切到 3D 白模时不会丢失当前选择。</p>
              </div>
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
          </>
        )}
        {tab === 'relations' && <RelationGraph scriptData={scriptData} />}
        {tab === 'gallery' && (
          <CharacterGallery
            characters={scriptData.characters}
            styleProfile={plan?.style}
            assets={plan?.assets}
            dispatch={dispatch}
          />
        )}
        {tab === 'briefs' && (
          <BriefPanel scenes={scriptData?.scenes || []} plan={plan} dispatch={dispatch} />
        )}
        {tab === 'rehearsal' && (
          <>
            <RehearsalPanel
              scenes={scenes}
              plan={plan}
              dispatch={dispatch}
            />
            <div className="mt-6">
              <ReviewTemplate plan={plan} dispatch={dispatch} />
            </div>
          </>
        )}
        {tab === 'visuals' && (
          <VisualStudio scriptData={scriptData} plan={plan} dispatch={dispatch} />
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
