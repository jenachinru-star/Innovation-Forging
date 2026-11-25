import { useState } from 'react';
import { STYLE_FAMILIES, familyById } from '../data/styles.js';
import StyleBible from './StyleBible.jsx';
import VisualWorkbench from './VisualWorkbench.jsx';

const SUB_TABS = [
  { id: 'bible', label: '视觉圣经' },
  { id: 'workbench', label: '生成工作台' },
];

export default function VisualStudio({ scriptData, plan, dispatch, readOnly = false }) {
  const saved = plan?.style || {};
  const [subTab, setSubTab] = useState('bible');

  const style = {
    familyId: saved.familyId || STYLE_FAMILIES[0].id,
    directorId: saved.directorId || '',
    targetId: saved.targetId || 'scene-plate',
  };
  const family = familyById(style.familyId);
  const viewStyle = {
    ...style,
    familyName: family.name,
    familyOptions: STYLE_FAMILIES,
  };

  function patchStyle(patch) {
    if (readOnly) return;
    const next = { ...style, ...patch };
    dispatch?.({ type: 'setStyle', style: next });
  }

  return (
    <section className="visual-studio" aria-label="视觉制作">
      <div className="visual-subtabs" role="tablist" aria-label="视觉制作视图">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`visual-subtab ${subTab === tab.id ? 'is-active' : ''}`}
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'bible' ? (
        <StyleBible style={viewStyle} onPatchStyle={patchStyle} readOnly={readOnly} />
      ) : (
        <VisualWorkbench
          scriptData={scriptData}
          plan={plan}
          dispatch={dispatch}
          style={viewStyle}
          onPatchStyle={patchStyle}
          readOnly={readOnly}
        />
      )}
    </section>
  );
}
