import { useMemo, useState } from 'react';
import {
  DIRECTOR_STYLES,
  STYLE_FAMILIES,
  STYLE_TARGETS,
  buildStylePrompt,
  directorsForFamily,
  familyById,
} from '../data/styles.js';

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

function downloadPromptPack({ projectName, family, director, targets, prompt }) {
  const body = [
    `# ${projectName || '未命名作品'} · 视觉制作包`,
    '',
    `- 视觉族：${family.name}`,
    `- 导演参照：${director?.name || '未选择'}`,
    `- 资产目标：${targets.map((item) => item.label).join('、')}`,
    '',
    '## 风格提示词',
    '',
    '```text',
    prompt,
    '```',
    '',
    '## 资产生成顺序',
    '',
    ...targets.map((item, index) => `${index + 1}. ${item.label}（${item.ratio}）`),
    '',
    '> 每次生成都应引用已确认的角色、地点和道具参考；不要重新描述已锁定外观。',
  ].join('\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${projectName || '未命名作品'}-视觉制作包.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function VisualStudio({ scriptData, plan, dispatch }) {
  const saved = plan?.style || {};
  const [familyId, setFamilyId] = useState(saved.familyId || STYLE_FAMILIES[0].id);
  const [directorId, setDirectorId] = useState(saved.directorId || '');
  const [targetId, setTargetId] = useState(saved.targetId || STYLE_TARGETS[0].id);
  const family = familyById(familyId);
  const directors = directorsForFamily(familyId);
  const director = DIRECTOR_STYLES.find((item) => item.id === directorId) || null;
  const palette = director?.palette || family.colors;
  const target = STYLE_TARGETS.find((item) => item.id === targetId) || STYLE_TARGETS[0];
  const characters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];

  const prompt = useMemo(
    () =>
      buildStylePrompt(
        { familyId, directorId, targetId },
        `${target.label}；${characters.map((item) => item.name).filter(Boolean).join('、') || '主要人物'}；作品视觉圣经`
      ),
    [characters, directorId, familyId, target.label, targetId]
  );

  function selectFamily(nextFamilyId) {
    setFamilyId(nextFamilyId);
    setDirectorId('');
  }

  function applyStyle() {
    dispatch?.({
      type: 'setStyle',
      style: {
        familyId,
        familyName: family.name,
        directorId,
        directorName: director?.name || '',
        targetId,
        palette,
        prompt,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return (
    <section className="visual-studio" aria-labelledby="visual-studio-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">视觉制作</span>
          <h2 id="visual-studio-title">先锁定世界观，再生成资产</h2>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              downloadPromptPack({
                projectName: plan?.name,
                family,
                director,
                targets: STYLE_TARGETS,
                prompt,
              })
            }
          >
            导出提示词包
          </button>
          <button type="button" className="btn-primary" onClick={applyStyle}>
            应用到作品
          </button>
        </div>
      </div>

      <div className="style-family-strip" role="list" aria-label="视觉风格族">
        {STYLE_FAMILIES.map((item) => (
          <button
            type="button"
            role="listitem"
            key={item.id}
            className={`style-family-card ${item.id === familyId ? 'is-active' : ''}`}
            onClick={() => selectFamily(item.id)}
          >
            <span className="style-family-colors" aria-hidden="true">
              {item.colors.slice(0, 4).map((color) => (
                <i key={color} style={{ backgroundColor: color }} />
              ))}
            </span>
            <b>{item.shortName}</b>
            <small>{item.name}</small>
          </button>
        ))}
      </div>

      <div className="visual-layout">
        <article className="style-sheet">
          <div className="style-sheet-head">
            <div>
              <span className="field-label">当前视觉族</span>
              <h3>{family.name}</h3>
            </div>
            <span className="status-stamp status-review">待确认</span>
          </div>
          <p className="style-description">{family.description}</p>

          <div className="palette-ruler" aria-label="配色比例">
            {palette.map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="palette-sample"
                style={{
                  backgroundColor: color,
                  flex: [4, 2, 2, 1, 1][index] || 1,
                  color: index < 2 ? '#f8f2e8' : '#171411',
                }}
              >
                <span>{color}</span>
                <small>{['主色', '辅色', '层次', '点缀', '高光'][index]}</small>
              </div>
            ))}
          </div>

          <div className="director-grid">
            {directors.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`director-card ${directorId === item.id ? 'is-active' : ''}`}
                onClick={() => setDirectorId(item.id)}
              >
                <span
                  className="director-thumb"
                  style={{
                    background: `linear-gradient(135deg, ${item.palette[0]} 0 55%, ${item.palette[3]} 55% 78%, ${item.palette[4]} 78%)`,
                  }}
                />
                <b>{item.name}</b>
                <small>{item.summary}</small>
              </button>
            ))}
          </div>
        </article>

        <aside className="asset-planner">
          <span className="field-label">生成目标</span>
          <div className="target-list" role="list">
            {STYLE_TARGETS.map((item) => (
              <button
                type="button"
                role="listitem"
                key={item.id}
                className={`target-row ${targetId === item.id ? 'is-active' : ''}`}
                onClick={() => setTargetId(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.ratio}</small>
                <span className="target-state">
                  {item.id === targetId ? '准备提示词' : '待建立'}
                </span>
              </button>
            ))}
          </div>

          <div className="prompt-preview">
            <div className="prompt-preview-head">
              <div>
                <span className="field-label">结构化提示词</span>
                <b>{target.label}</b>
              </div>
              <CopyButton text={prompt} />
            </div>
            <pre>{prompt}</pre>
          </div>

          <p className="helper-note">
            图片和视频生成是可选的在线增强。离线时仍可保存提示词、参考图位与资产清单。
          </p>
        </aside>
      </div>
    </section>
  );
}
