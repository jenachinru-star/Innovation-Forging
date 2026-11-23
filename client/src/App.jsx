import { useEffect, useReducer, useRef, useState } from 'react';
import InputStep from './components/InputStep.jsx';
import ConfirmStep from './components/ConfirmStep.jsx';
import ResultTabs from './components/ResultTabs.jsx';
import VersionCompare from './components/VersionCompare.jsx';
import { generateScript, parseScript } from './engine/index.js';
import { createPlan, planReducer } from './store/plan.js';
import { loadProject, saveProject } from './store/project.js';

function appPlanReducer(state, action) {
  if (action?.type === 'replacePlan') {
    return action.plan && typeof action.plan === 'object' ? action.plan : state;
  }
  return planReducer(state, action);
}

export default function App() {
  const [step, setStep] = useState('input'); // input | confirm | result | compare
  const [material, setMaterial] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [entryMode, setEntryMode] = useState('generate'); // generate | upload
  const [scriptData, setScriptData] = useState(null);
  const [plan, dispatch] = useReducer(appPlanReducer, undefined, () =>
    createPlan('stage', '我的舞台方案')
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    let active = true;
    loadProject()
      .then((saved) => {
        if (!active) return;
        if (saved && typeof saved === 'object') {
          if (saved.step) setStep(saved.step);
          if (typeof saved.scriptText === 'string') setScriptText(saved.scriptText);
          if (saved.scriptData) setScriptData(saved.scriptData);
          if (saved.plan) dispatch({ type: 'replacePlan', plan: saved.plan });
          setRestored(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        skipSaveRef.current = false;
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) return;
    saveProject({
      step,
      scriptText,
      scriptData,
      plan,
      savedAt: new Date().toISOString(),
    }).catch(() => {});
  }, [scriptData, plan]);

  function handleReady({ scriptText: text, material: mat, mode }) {
    setScriptText(text);
    setMaterial(mat || '');
    setEntryMode(mode);
    setError('');
    setStep('confirm');
  }

  async function handleRegenerate() {
    setBusy(true);
    setError('');
    try {
      const data = await generateScript(material);
      if (data.needMoreInfo) throw new Error(data.error);
      setScriptText(data.scriptText);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm({ aliasMap } = {}) {
    setBusy(true);
    setError('');
    try {
      const data = await parseScript(scriptText, { aliasMap });
      setScriptData(data.scriptData);
      setStep('result');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function handleChangeScene(index, patch) {
    setScriptData((prev) => {
      const scenes = prev.scenes.map((s, i) => (i === index ? { ...s, ...patch } : s));
      return { ...prev, scenes };
    });
  }

  return (
    <div data-theme="theatre" className="surface min-h-screen">
      {restored && (
        <div className="mx-auto max-w-5xl px-6 pt-6">
          <div
            className="flex items-center justify-between rounded-md px-4 py-2 text-sm"
            style={{
              backgroundColor: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid var(--accent-seal)',
              color: 'var(--ink)',
            }}
          >
            <span>已恢复上次进度</span>
            <button
              type="button"
              onClick={() => setRestored(false)}
              className="seal-text text-xs underline"
            >
              知道了
            </button>
          </div>
        </div>
      )}
      {step === 'input' && (
        <InputStep
          onReady={handleReady}
          busy={busy}
          setBusy={setBusy}
          error={error}
          setError={setError}
          onOpenCompare={() => setStep('compare')}
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
        />
      )}
      {step === 'result' && (
        <ResultTabs
          scriptData={scriptData}
          onBackToEdit={() => setStep('confirm')}
          onChangeScene={handleChangeScene}
          source={entryMode}
          plan={plan}
          dispatch={dispatch}
        />
      )}
      {step === 'compare' && <VersionCompare onBack={() => setStep('input')} />}
    </div>
  );
}
