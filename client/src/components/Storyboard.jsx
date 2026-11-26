import { Clapperboard, Plus, Trash2, Film } from 'lucide-react';
import { SHOT_TYPES } from '@director/shared/rules/coreDesk.js';

export default function Storyboard({ scriptData, plan, dispatch }) {
  const shots = Array.isArray(plan?.shots) ? plan.shots : [];
  const imageAssets = (Array.isArray(plan?.assets) ? plan.assets : []).filter(
    (a) => a?.url && a.type !== 'video'
  );
  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];

  function assetUrl(assetId) {
    return imageAssets.find((a) => a.id === assetId)?.url || '';
  }

  function patch(shot, patchObj) {
    dispatch({ type: 'updateShot', id: shot.id, patch: patchObj });
  }

  function addShot(scene) {
    const count = shots.filter((s) => s.sceneId === scene.id).length;
    dispatch({
      type: 'addShot',
      shot: {
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        shotNumber: count + 1,
        shotType: '中景',
        title: scene.title || `第 ${scene.sceneNumber} 场`,
        description: '',
        dialogue: '',
        assetId: '',
        durationSec: 0,
      },
    });
  }

  return (
    <div className="storyboard" data-testid="storyboard">
      {scenes.map((scene) => {
        const sceneShots = shots.filter((s) => s.sceneId === scene.id);
        return (
          <section key={scene.id} className="sb-scene">
            <div className="sb-scene-head">
              <h3>
                <Clapperboard size={16} aria-hidden />
                第 {scene.sceneNumber} 场 {scene.title}
              </h3>
              <button type="button" className="btn-ghost sb-add" onClick={() => addShot(scene)}>
                <Plus size={14} aria-hidden /> 添加镜头
              </button>
            </div>
            <div className="sb-grid">
              {sceneShots.map((shot) => {
                const url = assetUrl(shot.assetId);
                return (
                  <article key={shot.id} className="sb-card" data-testid={`shot-${shot.id}`}>
                    <div className="sb-thumb">
                      {url ? (
                        <img src={url} alt="" />
                      ) : (
                        <span className="sb-placeholder">
                          <Film size={22} aria-hidden />
                          <small>暂无画面</small>
                        </span>
                      )}
                      <select
                        className="sb-shottype"
                        value={shot.shotType}
                        onChange={(e) => patch(shot, { shotType: e.target.value })}
                        aria-label="景别"
                      >
                        {SHOT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sb-fields">
                      <label className="sb-field">
                        <span>画面描述</span>
                        <textarea
                          rows={2}
                          value={shot.description}
                          onChange={(e) => patch(shot, { description: e.target.value })}
                        />
                      </label>
                      <label className="sb-field">
                        <span>台词</span>
                        <input
                          value={shot.dialogue}
                          onChange={(e) => patch(shot, { dialogue: e.target.value })}
                        />
                      </label>
                      <label className="sb-field">
                        <span>关联图片</span>
                        <select
                          value={shot.assetId}
                          onChange={(e) => patch(shot, { assetId: e.target.value })}
                        >
                          <option value="">不关联</option>
                          {imageAssets.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.characterName || a.title || a.id}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="sb-delete"
                        onClick={() => dispatch({ type: 'removeShot', id: shot.id })}
                        aria-label="删除镜头"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
