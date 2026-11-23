import { useReducer, useState } from 'react';
import InputStep from './components/InputStep.jsx';
import ConfirmStep from './components/ConfirmStep.jsx';
import ResultTabs from './components/ResultTabs.jsx';
import VersionCompare from './components/VersionCompare.jsx';
import { generateScript, parseScript } from './engine/index.js';
import { createPlan, planReducer } from './store/plan.js';

export default function App() {
  const [step, setStep] = useState('input'); // input | confirm | result | compare
  const [material, setMaterial] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [entryMode, setEntryMode] = useState('generate'); // generate | upload
  const [scriptData, setScriptData] = useState(null);
  const [plan, dispatch] = useReducer(planReducer, undefined, () =>
    createPlan('stage', '我的舞台方案')
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-[#141010] text-[#f5ece0]">
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
