import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import InputStep from './components/InputStep.jsx';
import ConfirmStep from './components/ConfirmStep.jsx';
import ResultTabs from './components/ResultTabs.jsx';
import VersionCompare from './components/VersionCompare.jsx';
import ProjectLibrary from './components/ProjectLibrary.jsx';
import ProjectOverview from './components/ProjectOverview.jsx';
import { generateScript, parseScript } from './engine/index.js';
import { createPlan, planReducer } from './store/plan.js';
import {
  deleteProjectRecord,
  listProjectRecords,
  loadProject,
  loadProjectRecord,
  saveProject,
  saveProjectRecord,
} from './store/project.js';
import { findImpacts } from '@director/shared/rules/impact.js';

const NAV_ITEMS = [
  { id: 'overview', mark: '00', label: '项目总览', phase: '作品' },
  { id: 'script', mark: '01', label: '剧本与版本', phase: '作品' },
  { id: 'breakdown', mark: '02', label: '场次拆解', phase: '拆解', tab: 'schedule' },
  { id: 'relations', mark: '03', label: '人物与关系', phase: '拆解', tab: 'relations' },
  { id: 'stage', mark: '04', label: '排演与提示', phase: '排演', tab: 'stage' },
  { id: 'briefs', mark: '05', label: '部门需求', phase: '排演', tab: 'briefs' },
  { id: 'rehearsal', mark: '06', label: '排练与影响', phase: '排演', tab: 'rehearsal' },
  { id: 'visuals', mark: '07', label: '视觉制作', phase: '交付', tab: 'visuals' },
  { id: 'export', mark: '08', label: '导出与归档', phase: '交付', tab: 'export' },
];

function appPlanReducer(state, action) {
  if (action?.type === 'replacePlan') {
    return action.plan && typeof action.plan === 'object' ? action.plan : state;
  }
  return planReducer(state, action);
}

function createProjectId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function downloadArchive(record) {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
  const payload = JSON.stringify(
    {
      format: 'kaipai-project',
      version: 1,
      exportedAt: new Date().toISOString(),
      project: record,
    },
    null,
    2
  );
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${record.name || '未命名作品'}.kaipai.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      开
      <i />
    </span>
  );
}

export default function App() {
  const [step, setStep] = useState('input');
  const [material, setMaterial] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [scriptVersions, setScriptVersions] = useState([]);
  const [entryMode, setEntryMode] = useState('generate');
  const [scriptData, setScriptData] = useState(null);
  const [projectId, setProjectId] = useState(createProjectId);
  const [projects, setProjects] = useState([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('script');
  const [resultTab, setResultTab] = useState('schedule');
  const [compareReturnStep, setCompareReturnStep] = useState('input');
  const [plan, dispatch] = useReducer(appPlanReducer, undefined, () =>
    createPlan('stage', '我的舞台方案')
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [restored, setRestored] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([loadProject(), listProjectRecords()])
      .then(([saved, records]) => {
        if (!active) return;
        if (saved && typeof saved === 'object') {
          if (saved.projectId) setProjectId(saved.projectId);
          if (saved.step) setStep(saved.step);
          if (saved.activeNav) setActiveNav(saved.activeNav);
          if (saved.activeTab) setResultTab(saved.activeTab);
          if (typeof saved.scriptText === 'string') setScriptText(saved.scriptText);
          if (Array.isArray(saved.scriptVersions)) setScriptVersions(saved.scriptVersions);
          if (saved.scriptData) setScriptData(saved.scriptData);
          if (saved.plan) dispatch({ type: 'replacePlan', plan: saved.plan });
          setRestored(true);
        }
        if (Array.isArray(records)) {
          setProjects(
            records
              .filter((item) => item && item.id)
              .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        restoredRef.current = true;
      });
    return () => {
      active = false;
    };
  }, []);

  const projectName = plan?.name || '我的舞台方案';
  const sceneCount = Array.isArray(scriptData?.scenes) ? scriptData.scenes.length : 0;
  const unresolved = plan?.impacts?.filter((item) => item.status === 'open').length || 0;

  useEffect(() => {
    if (!restoredRef.current) return;
    const updatedAt = new Date().toISOString();
    const payload = {
      id: projectId,
      projectId,
      name: projectName,
      summary: scriptData?.summary || '',
      status: step === 'result' ? (unresolved ? '待复核' : '排演中') : '筹备中',
      sceneCount,
      updatedAt,
      step,
      activeNav,
      activeTab: resultTab,
      scriptText,
      scriptVersions,
      scriptData,
      plan,
    };
    setSaveStatus('saving');
    Promise.all([saveProject(payload), saveProjectRecord(payload)])
      .then(() => listProjectRecords())
      .then((records) => {
        setProjects(
          records
            .filter((item) => item && item.id)
            .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        );
        setSaveStatus('saved');
      })
      .catch(() => setSaveStatus('error'));
  }, [
    activeNav,
    plan,
    projectId,
    projectName,
    resultTab,
    sceneCount,
    scriptData,
    scriptText,
    scriptVersions,
    step,
    unresolved,
  ]);

  const phaseLabel = useMemo(() => {
    if (step === 'input') return '剧本来源';
    if (step === 'confirm') return '校对与确认';
    if (step === 'compare') return '版本对照';
    return '制作与交付';
  }, [step]);

  function resetProject() {
    const nextId = createProjectId();
    setProjectId(nextId);
    setStep('input');
    setMaterial('');
    setScriptText('');
    setScriptVersions([]);
    setEntryMode('generate');
    setScriptData(null);
    setActiveNav('script');
    setResultTab('schedule');
    setCompareReturnStep('input');
    setError('');
    setRestored(false);
    dispatch({ type: 'replacePlan', plan: createPlan('stage', '我的舞台方案') });
  }

  function handleCreateProject() {
    resetProject();
    setLibraryOpen(false);
  }

  async function handleOpenProject(id) {
    const record = await loadProjectRecord(id);
    if (!record) return;
    setProjectId(record.id || id);
    setStep(record.step || 'input');
    setScriptText(typeof record.scriptText === 'string' ? record.scriptText : '');
    setScriptVersions(Array.isArray(record.scriptVersions) ? record.scriptVersions : []);
    setScriptData(record.scriptData || null);
    setActiveNav(record.activeNav || 'script');
    setResultTab(record.activeTab || 'schedule');
    dispatch({ type: 'replacePlan', plan: record.plan || createPlan('stage', record.name || '我的舞台方案') });
    setLibraryOpen(false);
  }

  function handleImportProject(record) {
    const imported = {
      ...record,
      id: createProjectId(),
      updatedAt: new Date().toISOString(),
    };
    saveProjectRecord(imported)
      .then(() => listProjectRecords())
      .then(setProjects)
      .then(() => handleOpenProject(imported.id))
      .catch((importError) => setError(String(importError.message || importError)));
  }

  async function handleExportProject(id) {
    const record =
      id === projectId
        ? {
            id: projectId,
            name: projectName,
            summary: scriptData?.summary || '',
            updatedAt: new Date().toISOString(),
            step,
            activeNav,
            activeTab: resultTab,
            scriptText,
            scriptVersions,
            scriptData,
            plan,
          }
        : await loadProjectRecord(id);
    if (record) downloadArchive(record);
  }

  async function handleDeleteProject(id) {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const accepted = window.confirm('删除这件作品？本操作会同时删除本地保存的数据。');
      if (!accepted) return;
    }
    await deleteProjectRecord(id);
    const records = await listProjectRecords();
    setProjects(records);
    if (id === projectId) handleCreateProject();
  }

  async function handleDuplicateProject(id) {
    const source =
      id === projectId
        ? {
            id: projectId,
            name: projectName,
            summary: scriptData?.summary || '',
            updatedAt: new Date().toISOString(),
            step,
            activeNav,
            activeTab: resultTab,
            scriptText,
            scriptVersions,
            scriptData,
            plan,
          }
        : await loadProjectRecord(id);
    if (!source) return;
    const copy = {
      ...source,
      id: createProjectId(),
      name: `${source.name || '未命名作品'} · 副本`,
      updatedAt: new Date().toISOString(),
    };
    await saveProjectRecord(copy);
    setProjects(await listProjectRecords());
    await handleOpenProject(copy.id);
  }

  function navigate(id) {
    const item = NAV_ITEMS.find((entry) => entry.id === id);
    if (!item) return;
    setActiveNav(id);
    if (id === 'script') {
      setStep(scriptText ? 'confirm' : 'input');
      return;
    }
    if (id === 'overview') {
      if (scriptData) {
        setStep('result');
        setResultTab('schedule');
      } else {
        setStep('input');
      }
      return;
    }
    if (!scriptData) {
      setStep('input');
      return;
    }
    setStep('result');
    setResultTab(item.tab || 'schedule');
  }

  function handleReady({ scriptText: text, material: mat, mode }) {
    setScriptText(text);
    setMaterial(mat || '');
    setEntryMode(mode);
    setError('');
    setStep('confirm');
    setActiveNav('script');
  }

  async function handleRegenerate() {
    setBusy(true);
    setError('');
    try {
      const data = await generateScript(material);
      if (data.needMoreInfo) throw new Error(data.error);
      setScriptText(data.scriptText);
    } catch (generateError) {
      setError(String(generateError.message || generateError));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm({ aliasMap } = {}) {
    setBusy(true);
    setError('');
    try {
      const data = await parseScript(scriptText, {
        aliasMap,
        allowRemote: Boolean(plan?.aiConsent?.text),
      });
      const nextScriptData = data.scriptData;
      if (Array.isArray(plan?.cues) && plan.cues.length > 0) {
        const impacts = findImpacts({
          prevData: scriptData,
          nextData: nextScriptData,
          cues: plan.cues,
          briefs: plan.briefs,
        });
        for (const impact of impacts) dispatch({ type: 'addImpact', impact });
      }
      if (
        scriptData &&
        Array.isArray(plan?.assets) &&
        plan.assets.length > 0 &&
        JSON.stringify(scriptData) !== JSON.stringify(nextScriptData)
      ) {
        dispatch({ type: 'markAssetsStale', reason: '剧本结构或人物资料发生变化' });
      }
      setScriptData(nextScriptData);
      const nextVersion = {
        id: `script-${Date.now()}`,
        source: entryMode,
        parser: data.sourceMode || 'local',
        text: scriptText,
        data: nextScriptData,
        createdAt: new Date().toISOString(),
      };
      setScriptVersions((prev) => [...prev, nextVersion].slice(-30));
      dispatch({ type: 'setSourceVersion', id: nextVersion.id });
      setStep('result');
      setActiveNav('overview');
      setResultTab('schedule');
    } catch (confirmError) {
      setError(String(confirmError.message || confirmError));
    } finally {
      setBusy(false);
    }
  }

  function handleChangeScene(index, patch) {
    setScriptData((prev) => {
      const scenes = prev.scenes.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, ...patch } : scene
      );
      return { ...prev, scenes };
    });
  }

  const navGroups = ['作品', '拆解', '排演', '交付'];

  return (
    <div data-theme="theatre" className="app-root">
      <a className="skip-link" href="#workspace-main">
        跳到主要内容
      </a>
      <header className="app-topbar">
        <div className="brand-lockup">
          <BrandMark />
          <div>
            <b>开排</b>
            <span>舞台制作工作台</span>
          </div>
        </div>
        <div className="project-context">
          <span className="project-context-label">当前作品</span>
          <input
            className="project-context-name"
            aria-label="作品名"
            value={projectName}
            onChange={(event) => dispatch({ type: 'renamePlan', name: event.target.value })}
            onBlur={(event) => {
              if (!event.currentTarget.value.trim()) {
                dispatch({ type: 'renamePlan', name: '我的舞台方案' });
              }
            }}
          />
          <button
            type="button"
            className="project-switch-button"
            aria-label="打开作品库"
            onClick={() => setLibraryOpen(true)}
          >
            ⌄
          </button>
          <span className="project-context-version">剧本工作版</span>
        </div>
        <div className="topbar-actions">
          <span className={`save-state is-${saveStatus}`}>
            <i />
            {saveStatus === 'saving' && '正在保存'}
            {saveStatus === 'saved' && '本地已保存'}
            {saveStatus === 'error' && '保存失败'}
          </span>
          <button type="button" className="btn-ghost btn-small" onClick={() => setLibraryOpen(true)}>
            作品库
          </button>
          <button
            type="button"
            className="btn-primary btn-small"
            disabled={!scriptData}
            onClick={() => navigate('export')}
          >
            导出材料
          </button>
        </div>
      </header>

      <div className="app-shell">
        <aside className="project-rail">
          <div className="rail-project">
            <span className="rail-kicker">当前阶段</span>
            <b>{phaseLabel}</b>
            <p>{sceneCount ? `${sceneCount} 场 · ${unresolved} 条待处理` : '从剧本开始建立制作链路'}</p>
          </div>
          <nav aria-label="项目工作区" className="phase-nav">
            {navGroups.map((phase) => (
              <div className="phase-group" key={phase}>
                <span className="phase-label">{phase}</span>
                {NAV_ITEMS.filter((item) => item.phase === phase).map((item) => {
                  const needsScript = item.id !== 'script' && item.id !== 'overview';
                  const disabled = needsScript && !scriptData;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`rail-item ${activeNav === item.id ? 'is-active' : ''}`}
                      disabled={disabled}
                      onClick={() => navigate(item.id)}
                    >
                      <span className="rail-mark">{item.mark}</span>
                      <span>{item.label}</span>
                      {item.id === 'rehearsal' && unresolved > 0 && (
                        <span className="rail-count">{unresolved}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <button type="button" className="rail-library-link" onClick={() => setLibraryOpen(true)}>
            <span>打开本地作品库</span>
            <span aria-hidden="true">↗</span>
          </button>
        </aside>

        <main id="workspace-main" className="workspace-main">
          {restored && (
            <div className="restore-banner">
              <span>已恢复上次进度</span>
              <button type="button" onClick={() => setRestored(false)}>
                关闭
              </button>
            </div>
          )}
          <div className="workspace-paper">
            {step === 'input' && (
              <InputStep
                onReady={handleReady}
                busy={busy}
                setBusy={setBusy}
                error={error}
                setError={setError}
                onOpenCompare={() => {
                  setCompareReturnStep('input');
                  setStep('compare');
                  setActiveNav('script');
                }}
                aiEnabled={Boolean(plan?.aiConsent?.text)}
                onAiEnabledChange={(value) => dispatch({ type: 'setAIConsent', value })}
                onOpenCompare={() => {
                  setCompareReturnStep('confirm');
                  setStep('compare');
                }}
              />
            )}
            {step === 'confirm' && (
              <ConfirmStep
                scriptText={scriptText}
                onChangeScriptText={setScriptText}
                canRegenerate={entryMode === 'generate'}
                onRegenerate={handleRegenerate}
                onConfirm={handleConfirm}
                busy={busy}
                error={error}
                aiEnabled={Boolean(plan?.aiConsent?.text)}
                onAiEnabledChange={(value) => dispatch({ type: 'setAIConsent', value })}
              />
            )}
            {step === 'result' && (
              activeNav === 'overview' ? (
                <ProjectOverview
                  scriptData={scriptData}
                  plan={plan}
                  versions={scriptVersions}
                  onNavigate={navigate}
                />
              ) : (
                <ResultTabs
                  scriptData={scriptData}
                  onBackToEdit={() => {
                    setStep('confirm');
                    setActiveNav('script');
                  }}
                  onChangeScene={handleChangeScene}
                  source={entryMode}
                  briefs={plan?.briefs ?? []}
                  plan={plan}
                  dispatch={dispatch}
                  activeTab={resultTab}
                  onTabChange={(tab) => {
                    setResultTab(tab);
                    const next = NAV_ITEMS.find((item) => item.tab === tab);
                    if (next) setActiveNav(next.id);
                  }}
                  showTabs={false}
                />
              )
            )}
            {step === 'compare' && (
              <VersionCompare
                aiEnabled={Boolean(plan?.aiConsent?.text)}
                onBack={() => {
                  setStep(compareReturnStep);
                  setActiveNav('script');
                }}
              />
            )}
          </div>
        </main>

        <aside className="context-rail" aria-label="项目状态">
          <div className="context-section">
            <span className="rail-kicker">制作状态</span>
            <div className="context-stat">
              <b>{sceneCount || '—'}</b>
              <span>场次</span>
            </div>
            <div className="context-stat">
              <b>{scriptData?.characters?.length || '—'}</b>
              <span>人物</span>
            </div>
            <div className="context-stat">
              <b>{plan?.cues?.length || 0}</b>
              <span>提示</span>
            </div>
          </div>
          <div className="context-section">
            <span className="rail-kicker">现在要处理</span>
            {unresolved > 0 ? (
              <button type="button" className="context-alert" onClick={() => navigate('rehearsal')}>
                <span>{unresolved}</span>
                条修改影响等待确认
              </button>
            ) : (
              <p className="context-clear">没有未处理的制作冲突。</p>
            )}
          </div>
          <div className="context-section context-signature">
            <span className="rail-kicker">工作方法</span>
            <p>原话留在左侧，决定沉到右侧。任何提示都回到它触发的台词或动作。</p>
          </div>
        </aside>
      </div>

      <ProjectLibrary
        open={libraryOpen}
        projects={projects}
        currentId={projectId}
        onClose={() => setLibraryOpen(false)}
        onCreate={handleCreateProject}
        onOpen={handleOpenProject}
        onImport={handleImportProject}
        onExport={handleExportProject}
        onDelete={handleDeleteProject}
        onDuplicate={handleDuplicateProject}
      />
    </div>
  );
}
