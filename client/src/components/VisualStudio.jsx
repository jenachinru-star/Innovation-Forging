import { useState } from 'react';
import { STYLE_FAMILIES, familyById } from '../data/styles.js';
import StyleBible from './StyleBible.jsx';
import VisualWorkbench from './VisualWorkbench.jsx';
import banner from '../assets/visual/banner.jpg';

const SUB_TABS = [
  { id: 'bible', label: '视觉圣经' },
  { id: 'workbench', label: '生成工作台' },
];

export default function VisualStudio({ scriptData, plan, dispatch }) {
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
    const next = { ...style, ...patch };
    dispatch?.({ type: 'setStyle', style: next });
  }

  return (
    <section className="visual-studio" aria-label="视觉制作">
      <div className="visual-banner">
        <img src={banner} alt="" className="visual-banner-img" aria-hidden="true" />
        <div className="visual-banner-overlay">
          <span className="visual-banner-kicker">VISUAL PRODUCTION</span>
          <b className="visual-banner-title">用影像，把想象的故事变成可看见的画面</b>
        </div>
      </div>

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
        <StyleBible style={viewStyle} onPatchStyle={patchStyle} />
      ) : (
        <VisualWorkbench
          scriptData={scriptData}
          plan={plan}
          dispatch={dispatch}
          style={viewStyle}
          onPatchStyle={patchStyle}
        />
      )}
    </section>
  );
}
