import { useEffect, useMemo, useRef, useState } from 'react';
import { buildStylePrompt } from '../data/styles.js';
import { nextId } from '../store/plan.js';
import { SCENE_IMAGES } from '../assets/samples/index.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ASSET_BADGE = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  keyframe: '关键帧',
  poster: '海报',
  video: '视频',
};

// 各目标的生成规格：图片走 /api/visual，视频走 /api/video
const TARGET_SPECS = {
  'character-sheet': { kind: 'image', size: '864x1152', assetType: 'character' },
  'scene-plate': { kind: 'image', size: '1280x720', assetType: 'scene' },
  'prop-sheet': { kind: 'image', size: '1024x1024', assetType: 'prop' },
  keyframe: { kind: 'image', size: '1280x720', assetType: 'keyframe' },
  'shot-video': { kind: 'video', size: '', assetType: 'video' },
  poster: { kind: 'image', size: '864x1152', assetType: 'poster' },
};

const VIDEO_STATUS_TEXT = {
  queued: '排队中……',
  running: '正在生成视频……',
  failed: '视频生成失败',
};

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

export default function VisualWorkbench({
  plan,
  dispatch,
  style,
  onPatchStyle,
  readOnly = false,
}) {
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pollingRef = useRef(new Set());

  const spec = TARGET_SPECS[style.targetId] || TARGET_SPECS['scene-plate'];

  // 图片网格：已保存图片资产（排除视频）+ 本地场景兜底，按 id 去重
  const gridAssets = useMemo(() => {
    const fromPlan = (Array.isArray(plan?.assets) ? plan.assets : [])
      .filter((a) => a?.url && a.type !== 'video')
      .map((a) => ({
        id: a.id,
        title: a.characterName || a.title || '视觉资产',
        badge: ASSET_BADGE[a.type] || '场景',
        src: a.url,
      }));
    const used = new Set(fromPlan.map((a) => a.id));
    const local = SCENE_IMAGES.filter((s) => !used.has(s.id)).map((s) => ({
      id: s.id,
      title: s.title,
      badge: s.kind,
      src: s.src,
    }));
    return [...fromPlan, ...local];
  }, [plan?.assets]);

  const videoAssets = useMemo(
    () => (Array.isArray(plan?.assets) ? plan.assets : []).filter((a) => a.type === 'video'),
    [plan?.assets]
  );

  const promptText = useMemo(
    () =>
      buildStylePrompt(
        {
          familyId: style.familyId,
          directorId: style.directorId,
          targetId: style.targetId,
        },
        description.trim() || '人物与场景'
      ),
    [style, description]
  );

  // 轮询单个视频任务，直到终态；卸载或停止时退出
  async function pollVideo(asset) {
    const taskId = asset.taskId;
    pollingRef.current.add(taskId);
    while (pollingRef.current.has(taskId)) {
      await delay(5000);
      let res;
      try {
        res = await fetch(`/api/video/tasks/${encodeURIComponent(taskId)}`);
      } catch {
        break; // 离线/网络错误时停止，不刷屏
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) break;

      dispatch?.({
        type: 'upsertAsset',
        asset: {
          id: asset.id,
          type: 'video',
          taskId,
          status: data.status,
          ...(data.videoUrl ? { url: data.videoUrl } : {}),
          ...(data.error ? { error: data.error } : {}),
          updatedAt: new Date().toISOString(),
        },
      });
      if (data.status === 'succeeded' || data.status === 'failed') break;
    }
    pollingRef.current.delete(taskId);
  }

  // 发现未完成的视频任务即启动轮询（含刷新后恢复）
  useEffect(() => {
    const pending = videoAssets.filter(
      (a) => a.taskId && ['queued', 'running'].includes(a.status)
    );
    for (const asset of pending) {
      if (!pollingRef.current.has(asset.taskId)) {
        pollVideo(asset);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoAssets]);

  // 卸载时停止全部轮询
  useEffect(() => () => pollingRef.current.clear(), []);

  async function createImage(desc) {
    const res = await fetch('/api/visual/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleName: style.familyName,
        description: desc,
        size: spec.size,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '生成失败，请稍后再试');

    dispatch?.({
      type: 'upsertAsset',
      asset: {
        id: nextId('asset', plan?.assets),
        type: spec.assetType,
        title: desc.slice(0, 10),
        status: 'selected',
        url: data.imageUrl,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async function createVideo(desc) {
    const res = await fetch('/api/video/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: desc, ratio: '16:9', duration: 5 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '视频生成失败，请稍后再试');

    dispatch?.({
      type: 'upsertAsset',
      asset: {
        id: nextId('asset', plan?.assets),
        type: 'video',
        title: desc.slice(0, 10),
        status: data.status || 'queued',
        taskId: data.taskId,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async function handleGenerate() {
    if (readOnly) return;
    const desc = description.trim();
    if (!desc || busy) return;
    setError('');
    setBusy(true);
    try {
      if (spec.kind === 'video') {
        await createVideo(desc);
      } else {
        await createImage(desc);
      }
      setDescription('');
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="visual-workbench">
      <div className="visual-generate-card panel-card">
        <label htmlFor="visual-style" className="visual-style-label">
          视觉风格
        </label>
        <select
          id="visual-style"
          className="field visual-style-select"
          value={style.familyId}
          onChange={(e) => onPatchStyle({ familyId: e.target.value, directorId: '' })}
          disabled={readOnly}
        >
          {style.familyOptions.map((item) => (
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
          disabled={readOnly}
          placeholder={
            spec.kind === 'video'
              ? '描述镜头内容，例如：镜头缓缓推向老戏台，人物转身……'
              : '描述你想要的画面，例如：黄昏下的老戏台，暖光穿过木梁……'
          }
          aria-label="画面描述"
        />

        <button
          type="button"
          className="btn-seal visual-generate-btn"
          onClick={handleGenerate}
          disabled={readOnly || busy || !description.trim()}
        >
          {busy ? (spec.kind === 'video' ? '提交中' : '生成中') : '生成'}
        </button>
      </div>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      <div className="visual-grid">
        {gridAssets.map((asset) => (
          <figure key={asset.id} className="visual-card" data-testid={`visual-card-${asset.id}`}>
            <img src={asset.src} alt={asset.title} className="visual-card-img" />
            <figcaption className="visual-card-title">{asset.title}</figcaption>
            <span className="visual-card-badge">{asset.badge}</span>
          </figure>
        ))}

        {busy && spec.kind === 'image' && (
          <figure className="visual-card is-loading" data-testid="visual-loading">
            <span className="visual-loader" aria-hidden />
            <figcaption className="visual-loading-text">正在生成……</figcaption>
          </figure>
        )}
      </div>

      {videoAssets.length > 0 && (
        <section className="video-section" aria-label="镜头视频">
          <h3 className="bible-block-title">镜头视频</h3>
          <div className="video-card-grid">
            {videoAssets.map((asset) => (
              <figure key={asset.id} className="video-card" data-testid={`video-card-${asset.id}`}>
                {asset.url ? (
                  <video src={asset.url} controls className="video-player" />
                ) : (
                  <div className="video-pending">
                    <span className="visual-loader" aria-hidden />
                    <p>{VIDEO_STATUS_TEXT[asset.status] || '准备中……'}</p>
                  </div>
                )}
                <figcaption className="video-card-title">
                  {asset.title}
                  {asset.error ? ` · ${asset.error}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="prompt-preview visual-prompt-preview">
        <div className="prompt-preview-head">
          <span className="field-label">结构化提示词</span>
          <CopyButton text={promptText} />
        </div>
        <pre>{promptText}</pre>
      </div>
    </div>
  );
}
