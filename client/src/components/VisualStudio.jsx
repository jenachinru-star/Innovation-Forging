import { useMemo, useState } from 'react';
import {
  STYLE_FAMILIES,
  buildStylePrompt,
  familyById,
} from '../data/styles.js';
import { nextId } from '../store/plan.js';
import { SCENE_IMAGES } from '../assets/samples/index.js';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="btn-ghost btn-small" onClick={copy}>
      {copied ? '已复制' : '复制提示词'}
    </button>
  );
}

export default function VisualStudio({ scriptData, plan, dispatch }) {
  const saved = plan?.style || {};
  const [familyId, setFamilyId] = useState(saved.familyId || STYLE_FAMILIES[0].id);
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const family = familyById(familyId);

  // 网格数据：已保存资产 + 本地场景图兜底（按 id 去重）
  const gridAssets = useMemo(() => {
    const fromPlan = (Array.isArray(plan?.assets) ? plan.assets : [])
      .filter((a) => a?.url)
      .map((a) => ({
        id: a.id,
        title: a.characterName || a.title || '视觉资产',
        kind: a.type === 'character' ? '角色' : '场景',
        src: a.url,
      }));
    const used = new Set(fromPlan.map((a) => a.id));
    const local = SCENE_IMAGES.filter((s) => !used.has(s.id)).map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      src: s.src,
    }));
    return [...fromPlan, ...local];
  }, [plan?.assets]);

  // 结构化提示词（保留预览）
  const promptText = useMemo(
    () =>
      buildStylePrompt(
        { familyId, directorId: '', targetId: 'scene-plate' },
        description.trim() || '场景与主要人物'
      ),
    [familyId, description]
  );

  async function handleGenerate() {
    const desc = description.trim();
    if (!desc || generating) return;
    setError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/visual/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleName: family.name,
          description: desc,
          size: '1024x1024',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '生成失败，请稍后再试');

      dispatch?.({
        type: 'upsertAsset',
        asset: {
          id: nextId('asset', plan?.assets),
          type: 'scene',
          title: desc.slice(0, 10),
          status: 'selected',
          url: data.imageUrl,
          updatedAt: new Date().toISOString(),
        },
      });
      setDescription('');
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="visual-studio" aria-labelledby="visual-studio-title">
      <div className="section-heading">
        <span className="eyebrow">交付</span>
        <h2 id="visual-studio-title">视觉制作</h2>
      </div>

      {/* 顶部生成卡片 */}
      <div className="visual-generate-card panel-card">
        <label htmlFor="visual-style" className="visual-style-label">
          视觉风格
        </label>
        <select
          id="visual-style"
          className="field visual-style-select"
          value={familyId}
          onChange={(e) => setFamilyId(e.target.value)}
        >
          {STYLE_FAMILIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="field visual-desc-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGenerate();
          }}
          placeholder="描述你想要的画面，例如：黄昏下的老戏台，暖光穿过木梁……"
          aria-label="画面描述"
        />

        <button
          type="button"
          className="btn-seal visual-generate-btn"
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
        >
          {generating ? '生成中' : '生成'}
        </button>
      </div>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      {/* 3 x 2 图片网格 */}
      <div className="visual-grid">
        {gridAssets.map((asset) => (
          <figure key={asset.id} className="visual-card" data-testid={`visual-card-${asset.id}`}>
            <img src={asset.src} alt={asset.title} className="visual-card-img" />
            <figcaption className="visual-card-title">{asset.title}</figcaption>
            <span className="visual-card-badge">{asset.kind}</span>
          </figure>
        ))}

        {generating && (
          <figure className="visual-card is-loading" data-testid="visual-loading">
            <span className="visual-loader" aria-hidden />
            <figcaption className="visual-loading-text">正在生成……</figcaption>
          </figure>
        )}
      </div>

      {/* 结构化提示词预览 */}
      <div className="prompt-preview visual-prompt-preview">
        <div className="prompt-preview-head">
          <span className="field-label">结构化提示词</span>
          <CopyButton text={promptText} />
        </div>
        <pre>{promptText}</pre>
      </div>
    </section>
  );
}
