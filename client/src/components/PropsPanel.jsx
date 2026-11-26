import { useState } from 'react';

/**
 * 道具清单面板：按场次分组维护道具，改动即时写回剧本拆解。
 * 数据落在 scriptData.scenes[].props，通过 onChangeScene(index, { props }) 回写。
 */
export default function PropsPanel({ scriptData, onChangeScene }) {
  const scenes = scriptData?.scenes || [];
  const editable = typeof onChangeScene === 'function';
  const [drafts, setDrafts] = useState({});

  function setDraft(sceneNumber, value) {
    setDrafts((prev) => ({ ...prev, [sceneNumber]: value }));
  }

  function addProp(index, scene) {
    const text = String(drafts[scene.sceneNumber] || '').trim();
    if (!text) return;
    const props = Array.isArray(scene.props) ? [...scene.props, text] : [text];
    onChangeScene(index, { props });
    setDraft(scene.sceneNumber, '');
  }

  function removeProp(index, scene, propIndex) {
    const props = Array.isArray(scene.props) ? scene.props.filter((_, i) => i !== propIndex) : [];
    onChangeScene(index, { props });
  }

  return (
    <div className="props-panel">
      <p className="muted mb-4 text-sm">
        按场次核对与维护道具；改动即时写回剧本拆解。
      </p>
      {scenes.length === 0 ? (
        <p className="muted text-sm">暂无可展示的场次。</p>
      ) : (
        <div className="props-grid">
          {scenes.map((scene, index) => {
            const props = Array.isArray(scene.props) ? scene.props : [];
            const label = scene.title || `第 ${scene.sceneNumber} 场`;
            return (
              <section key={scene.id || scene.sceneNumber} className="props-card">
                <header className="props-card-head">
                  <h3 className="props-card-title">{label}</h3>
                  <span className="muted text-xs">{props.length} 项</span>
                </header>
                {props.length > 0 ? (
                  <ul className="props-chips">
                    {props.map((prop, propIndex) => (
                      <li key={`${prop}-${propIndex}`} className="props-chip">
                        <span>{prop}</span>
                        {editable && (
                          <button
                            type="button"
                            className="props-chip-remove"
                            aria-label={`删除道具 ${prop}`}
                            onClick={() => removeProp(index, scene, propIndex)}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted text-xs">暂无道具。</p>
                )}
                {editable && (
                  <div className="props-add">
                    <input
                      value={drafts[scene.sceneNumber] || ''}
                      onChange={(e) => setDraft(scene.sceneNumber, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addProp(index, scene);
                        }
                      }}
                      placeholder="新增道具，回车确认"
                      className="field px-2 py-1 text-sm"
                      aria-label={`为 ${label} 新增道具`}
                    />
                    <button
                      type="button"
                      className="btn-seal px-3 py-1.5 text-sm"
                      onClick={() => addProp(index, scene)}
                    >
                      添加
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}