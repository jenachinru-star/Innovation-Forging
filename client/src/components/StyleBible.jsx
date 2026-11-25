import { useState } from 'react';
import {
  STYLE_FAMILIES,
  STYLE_TARGETS,
  DIRECTOR_STYLES,
  familyById,
} from '../data/styles.js';
import { STYLE_THUMBS, DIRECTOR_THUMBS } from '../assets/visual/index.js';
import {
  User,
  Image as ImageIcon,
  Package,
  Film,
  Video,
  FileImage,
  Clapperboard,
  Palette,
  Target,
  ChevronDown,
} from 'lucide-react';

const TARGET_ICONS = {
  'character-sheet': User,
  'scene-plate': ImageIcon,
  'prop-sheet': Package,
  keyframe: Film,
  'shot-video': Video,
  poster: FileImage,
};

// 配色比例：项目统一色彩体系（固定 5 段，与电影感写实风格一致）
const PALETTE_BANNER = [
  { role: '主色', hex: '#8B1E25', meaning: '情感与冲突' },
  { role: '金色', hex: '#D4AF37', meaning: '温暖与希望' },
  { role: '棕色', hex: '#4A3A2A', meaning: '沉稳与基底' },
  { role: '青色', hex: '#2A6B7C', meaning: '对比与呼吸' },
  { role: '米白', hex: '#F5EFE6', meaning: '纯净与留白' },
];

// 导演卡展示文案（数据层 summary 供提示词使用，这里负责卡片呈现）
const DIRECTOR_META = {
  'wes-anderson': { subtitle: '对称构图与复古色彩', note: '色彩规整，对称而浪漫' },
  'denis-villeneuve': { subtitle: '宏大叙事与光影诗意', note: '光影深沉，史诗而神秘' },
  'hayao-miyazaki': { subtitle: '自然与治愈的温度', note: '清新柔和，温暖治愈' },
};

// 可折叠区块：标题行点击切换，箭头真实旋转
function CollapsibleBlock({ icon: Icon, title, subtitle, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`bible-block collapsible-block ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="collapsible-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="collapsible-icon"><Icon size={18} aria-hidden /></span>
        <span className="collapsible-text">
          <b>{title}</b>
          {subtitle && <small>{subtitle}</small>}
        </span>
        <ChevronDown size={18} className="collapsible-chevron" aria-hidden />
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}

export default function StyleBible({ style, onPatchStyle }) {
  const family = familyById(style.familyId);

  function selectFamily(familyId) {
    onPatchStyle({ familyId, directorId: '' });
  }

  function toggleDirector(directorId) {
    onPatchStyle({ directorId: style.directorId === directorId ? '' : directorId });
  }

  return (
    <div className="style-bible">
      <CollapsibleBlock
        icon={Clapperboard}
        title="视觉风格"
        subtitle="选择并定义项目的视觉风格，影响整体影像基调与气质"
      >
        <div className="style-family-strip">
          {STYLE_FAMILIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`style-family-card ${family.id === item.id ? 'is-active' : ''}`}
              onClick={() => selectFamily(item.id)}
              aria-pressed={family.id === item.id}
            >
              <img
                className="style-family-thumb"
                src={STYLE_THUMBS[item.id]}
                alt={item.name}
              />
              <b>{item.shortName}</b>
              <span className="style-family-colors" aria-hidden>
                {item.colors.map((color) => (
                  <i key={color} style={{ backgroundColor: color }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleBlock>

      <CollapsibleBlock
        icon={Palette}
        title="配色比例"
        subtitle="定义主色与辅助色的使用比例，构建统一的色彩体系"
      >
        <div className="palette-banner">
          <div className="palette-banner-swatches">
            {PALETTE_BANNER.map((item) => (
              <span key={item.role} className="palette-banner-swatch" style={{ backgroundColor: item.hex }} />
            ))}
          </div>
          <div className="palette-banner-labels">
            {PALETTE_BANNER.map((item) => (
              <div key={item.role} className="palette-banner-item">
                <b>{item.role} <small>{item.hex}</small></b>
                <span>{item.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleBlock>

      <CollapsibleBlock
        icon={Film}
        title="导演参照"
        subtitle="从电影大师的作品中，汲取灵感与叙事语言"
      >
        <div className="director-grid" data-count={DIRECTOR_STYLES.length}>
          {DIRECTOR_STYLES.map((director) => {
            const meta = DIRECTOR_META[director.id];
            return (
              <button
                key={director.id}
                type="button"
                className={`director-card ${
                  style.directorId === director.id ? 'is-active' : ''
                }`}
                onClick={() => toggleDirector(director.id)}
                aria-pressed={style.directorId === director.id}
              >
                <img
                  className="director-thumb"
                  src={DIRECTOR_THUMBS[director.id]}
                  alt={director.name}
                />
                <span className="director-info">
                  <b>{director.name}</b>
                  <small className="director-subtitle">{meta.subtitle}</small>
                  <span className="director-palette" aria-hidden>
                    {director.palette.map((color) => (
                      <i key={color} style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <small className="director-note">{meta.note}</small>
                </span>
              </button>
            );
          })}
        </div>
      </CollapsibleBlock>

      <CollapsibleBlock
        icon={Target}
        title="生成目标"
        subtitle="明确本次视觉制作的产出目标，聚焦创作方向"
      >
        <div className="target-card-grid">
          {STYLE_TARGETS.map((target) => {
            const Icon = TARGET_ICONS[target.id];
            return (
              <button
                key={target.id}
                type="button"
                className={`target-card ${
                  style.targetId === target.id ? 'is-active' : ''
                }`}
                onClick={() => onPatchStyle({ targetId: target.id })}
                aria-pressed={style.targetId === target.id}
              >
                <Icon size={18} aria-hidden />
                <b>{target.label}</b>
                <small>{target.ratio}</small>
              </button>
            );
          })}
        </div>
      </CollapsibleBlock>
    </div>
  );
}
