import { useState } from 'react';
import { STYLE_FAMILIES, familyById } from '../data/styles.js';
import StyleBible from './StyleBible.jsx';
import VisualWorkbench from './VisualWorkbench.jsx';
import banner from '../assets/visual/banner.jpg';

const SUB_TABS = [
  { id: 'bible', label: '视觉圣经' },
  { id: 'workbench', label: '生成工作台' },
];

const FILM_STRIP_TEXT = {
  bible: '让每一个镜头，都值得期待',
  workbench: '光影之间，故事生长',
};

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
      {/* 固定整页实景背景（只在内容区，避开顶栏与侧栏） */}
      <div className="visual-page-bg" aria-hidden="true">
        <img src={banner} className="visual-page-bg-img" alt="" />
      </div>
      <div className="visual-page-mask" aria-hidden="true" />

      {/* 通栏页头：标题 + 子 Tab 叠在横幅内 */}
      <header className="visual-hero">
        <img src={banner} className="visual-hero-img" alt="" aria-hidden="true" />
        <div className="visual-hero-overlay">
          <div className="visual-hero-text">
            <span className="visual-hero-kicker">VISUAL PRODUCTION</span>
            <h2 className="visual-hero-title">视觉制作</h2>
            <p className="visual-hero-sub">用影像，把想象的故事变成可看见的画面</p>
          </div>
          <div className="visual-hero-tabs" role="tablist" aria-label="视觉制作视图">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={`visual-hero-tab ${subTab === tab.id ? 'is-active' : ''}`}
                aria-selected={subTab === tab.id}
                onClick={() => setSubTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 真实内容组件 */}
      <div className="visual-body">
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
      </div>

      {/* 底部胶片条，文案随子 Tab 变化 */}
      <footer className="visual-filmstrip">
        <span className="visual-filmstrip-holes" aria-hidden="true" />
        <span className="visual-filmstrip-text">{FILM_STRIP_TEXT[subTab]}</span>
        <span className="visual-filmstrip-holes" aria-hidden="true" />
      </footer>
    </section>
  );
}
