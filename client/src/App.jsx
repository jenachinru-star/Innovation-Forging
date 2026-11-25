import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import InputStep from './components/InputStep.jsx';
import ConfirmStep from './components/ConfirmStep.jsx';
import ResultTabs from './components/ResultTabs.jsx';
import VersionCompare from './components/VersionCompare.jsx';
import ProjectLibrary from './components/ProjectLibrary.jsx';
import ProjectOverview from './components/ProjectOverview.jsx';
import Landing from './components/Landing.jsx';
import { generateScript, parseScript } from './engine/index.js';
import { createPlan, planReducer } from './store/plan.js';
import { currentUser, logout } from './api/auth.js';
import {
  listProjects,
  getProject,
  saveProject as persistProject,
  removeProject,
} from './api/projects.js';
import { findImpacts } from '@director/shared/rules/impact.js';
import OnboardingGuide, { hasSeenOnboarding } from './components/OnboardingGuide.jsx';
import FilmCameraIcon from './components/FilmCameraIcon.jsx';
import { User, ChevronDown, LogOut, ArrowLeft } from 'lucide-react';

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
    { format: 'kaipai-project', version: 1, exportedAt: new Date().toISOString(), project: record },
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

function AccountMenu({ username, onBackToCover, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar">
          <User size={15} aria-hidden />
        </span>
        <span className="account-name">{username}</span>
        <ChevronDown size={14} className={`account-caret ${open ? 'is-open' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="account-dropdown" role="menu">
          <div className="account-dropdown-head">{username}</div>
          <button
            type="button"
            role="menuitem"
            className="account-dropdown-item"
            onClick={() => {
              setOpen(false);
              onBackToCover();
            }}
          >
            <ArrowLeft size={14} aria-hidden /> 返回封面
          </button>
          <button
            type="button"
            role="menuitem"
            className="account-dropdown-item"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={14} aria-hidden /> 退出登录
          </button>
        </div>
      )}
    </div>
  );
}

const STEP_DEFS = [
  { id: 'input', label: '准备剧本' },
  { id: 'confirm', label: '校对修改' },
  { id: 'result', label: '舞台制作' },
];

function StepBar({ current, reachable, onJump }) {
  return (
    <ol className="step-bar" aria-label="制作进度">
      {STEP_DEFS.map((stepDef, index) => {
        const state =
          index < current ? 'is-done' : index === current ? 'is-current' : 'is-todo';
        return (
          <li key={stepDef.id} className={`step-item ${state}`}>
            <button
              type="button"
              className="step-link"
              disabled={!reachable[index]}
              onClick={() => onJump(index)}
              aria-current={index === current ? 'step' : undefined}
            >
              <span className="step-dot">{index < current ? '✓' : index + 1}</span>
              <span className="step-label">{stepDef.label}</span>
            </button>
            {index < STEP_DEFS.length - 1 && (
              <span className="step-connector" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState('cover'); // cover | workbench
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

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

  const projectName = plan?.name || '我的舞台方案';
  const sceneCount = Array.isArray(scriptData?.scenes) ? scriptData.scenes.length : 0;
  const unresolved = plan?.impacts?.filter((item) => item.status === 'open').length || 0;

  function applyRecord(record) {
    setProjectId(record.id);
    setStep(record.step || 'input');
    setActiveNav(record.activeNav || 'script');
    setResultTab(record.activeTab || 'schedule');
    setScriptText(typeof record.scriptText === 'string' ? record.scriptText : '');
    setScriptVersions(Array.isArray(record.scriptVersions) ? record.scriptVersions : []);
    setScriptData(record.scriptData || null);
    dispatch({
      type: 'replacePlan',
      plan: record.plan || createPlan('stage', record.name || '我的舞台方案'),
    });
  }

  // 启动：检查后端会话，有则恢复作品
  useEffect(() => {
    let active = true;
    currentUser()
      .then(async (u) => {
        if (!active || !u) return;
        setUser(u);
        const list = await listProjects();
        if (!active) return;
        setProjects(list);
        if (list[0]) applyRecord(list[0]);
        else resetProject();
        setHydrated(true);
        setView('workbench');
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBooted(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动保存：工作台且已恢复后，debounce 写入后端
  useEffect(() => {
    if (view !== 'workbench' || !hydrated) return undefined;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const record = {
        id: projectId,
        name: projectName,
        summary: scriptData?.summary || '',
        status: step === 'result' ? (unresolved ? '待复核' : '排演中') : '筹备中',
        sceneCount,
        updatedAt: new Date().toISOString(),
        step,
        activeNav,
        activeTab: resultTab,
        scriptText,
        scriptVersions,
        scriptData,
        plan,
      };
      persistProject(projectId, record)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
    }, 600);
    return () => clearTimeout(timer);
  }, [
    view,
    hydrated,
    projectId,
    projectName,
    sceneCount,
    unresolved,
    step,
    activeNav,
    resultTab,
    scriptText,
    scriptVersions,
    scriptData,
    plan,
  ]);

  const phaseLabel = useMemo(() => {
    if (step === 'input') return '剧本来源';
    if (step === 'confirm') return '校对与确认';
    if (step === 'compare') return '版本对照';
    return '制作与交付';
  }, [step]);

  function resetProject() {
    setProjectId(createProjectId());
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
    dispatch({ type: 'replacePlan', plan: createPlan('stage', '我的舞台方案') });
  }

  async function handleOpenProject(id) {
    const record = await getProject(id);
    if (!record) return;
    applyRecord(record);
    setLibraryOpen(false);
  }

  function handleCreateProject() {
    resetProject();
    setLibraryOpen(false);
  }

  async function handleImportProject(record) {
    const id = createProjectId();
    const imported = { ...record, id, updatedAt: new Date().toISOString() };
    await persistProject(id, imported);
    setProjects(await listProjects());
    await handleOpenProject(id);
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
        : await getProject(id);
    if (record) downloadArchive(record);
  }

  async function handleDeleteProject(id) {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const accepted = window.confirm('删除这件作品？会同时删除服务端保存的数据。');
      if (!accepted) return;
    }
    await removeProject(id);
    setProjects(await listProjects());
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
        : await getProject(id);
    if (!source) return;
    const newId = createProjectId();
    const copy = {
      ...source,
      id: newId,
      name: `${source.name || '未命名作品'} · 副本`,
      updatedAt: new Date().toISOString(),
    };
    await persistProject(newId, copy);
    setProjects(await listProjects());
    await handleOpenProject(newId);
  }

  // ===== 视图 / 认证回调 =====
  async function handleAuth() {
    const u = await currentUser();
    setUser(u);
    const list = await listProjects();
    setProjects(list);
    // 以服务端数据为准：有作品恢复最新一条，否则给干净空白项目
    if (list[0]) applyRecord(list[0]);
    else resetProject();
    setHydrated(true);
    setView('workbench');
    // 首次登录且未看过指引时弹出新手指引
    if (!hasSeenOnboarding()) setShowGuide(true);
  }

  function handleResume() {
    setView('workbench');
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setHydrated(false);
    resetProject();
    setView('cover');
  }

  function handleBackToCover() {
    setView('cover');
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

  function jumpToStep(index) {
    if (index === 0) {
      setStep('input');
      setActiveNav('script');
    } else if (index === 1) {
      if (!scriptText) return;
      setStep('confirm');
      setActiveNav('script');
    } else if (index === 2) {
      if (!scriptData) return;
      setStep('result');
      setActiveNav('overview');
      setResultTab('schedule');
    }
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
        dispatch({ type: 'markAssetsStale', reason: '剧本结构或人物资料变化' });
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

  if (!booted) {
    return <div className="app-boot" aria-label="正在启动" />;
  }

  if (view === 'cover') {
    return (
      <Landing
        user={user}
        onAuth={handleAuth}
        onResume={handleResume}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div data-theme="theatre" className="app-root">
      <a className="skip-link" href="#workspace-main">
        跳到主要内容
      </a>
      <header className="app-topbar">
        <div className="brand-lockup">
          <FilmCameraIcon className="brand-film-icon" />
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
          <button
            type="button"
            className="btn-ghost btn-small"
            onClick={() => setLibraryOpen(true)}
          >
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
          <AccountMenu
            username={user?.username}
            onBackToCover={handleBackToCover}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <div className="app-shell">
        <aside className="project-rail">
          <div className="rail-project">
            <span className="rail-kicker">当前阶段</span>
            <b>{phaseLabel}</b>
            <p>
              {sceneCount ? `${sceneCount} 场 · ${unresolved} 条待处理` : '从剧本开始建立制作链路'}
            </p>
          </div>
          <nav aria-label="项目工作区" className="phase-nav">
            {navGroupsMarkup()}
          </nav>
          <button
            type="button"
            className="rail-library-link"
            onClick={() => setLibraryOpen(true)}
          >
            <span>打开本地作品库</span>
            <span aria-hidden="true">↗</span>
          </button>
        </aside>

        <main id="workspace-main" className="workspace-main">
          <StepBar
            current={step === 'input' ? 0 : step === 'result' ? 2 : 1}
            reachable={[true, Boolean(scriptText), Boolean(scriptData)]}
            onJump={jumpToStep}
          />
          <fieldset className="workspace-paper">
            {step === 'input' && (
              <InputStep
                onReady={handleReady}
                initialText={scriptText}
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
              />
            )}
            {step === 'confirm' && (
              <ConfirmStep
                scriptText={scriptText}
                onChangeScriptText={setScriptText}
                canRegenerate={entryMode === 'generate'}
                onBack={() => setStep('input')}
                onRegenerate={handleRegenerate}
                onConfirm={handleConfirm}
                busy={busy}
                error={error}
                aiEnabled={Boolean(plan?.aiConsent?.text)}
                onAiEnabledChange={(value) => dispatch({ type: 'setAIConsent', value })}
              />
            )}
            {step === 'result' &&
              (activeNav === 'overview' ? (
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
              ))}
            {step === 'compare' && (
              <VersionCompare
                aiEnabled={Boolean(plan?.aiConsent?.text)}
                onBack={() => {
                  setStep(compareReturnStep);
                  setActiveNav('script');
                }}
              />
            )}
          </fieldset>
        </main>
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

      {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
    </div>
  );

  function navGroupsMarkup() {
    return ['作品', '拆解', '排演', '交付'].map((phase) => (
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
    ));
  }
}
