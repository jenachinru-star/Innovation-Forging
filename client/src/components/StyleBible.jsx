import {
  STYLE_FAMILIES,
  STYLE_TARGETS,
  familyById,
  directorsForFamily,
} from '../data/styles.js';
import {
  User,
  Image as ImageIcon,
  Package,
  Film,
  Video,
  FileImage,
} from 'lucide-react';

const TARGET_ICONS = {
  'character-sheet': User,
  'scene-plate': ImageIcon,
  'prop-sheet': Package,
  keyframe: Film,
  'shot-video': Video,
  poster: FileImage,
};

const PALETTE_ROLES = ['主色', '辅色', '层次', '点缀', '高光'];
const PALETTE_WEIGHTS = [45, 20, 15, 10, 10];

// 按底色亮度返回可读文字色（深底浅字、浅底深字）
function readableText(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1815' : 'rgba(255,255,255,0.92)';
}

export default function StyleBible({ style, onPatchStyle, readOnly = false }) {
  const family = familyById(style.familyId);
  const directors = directorsForFamily(family.id);

  function selectFamily(familyId) {
    onPatchStyle({ familyId, directorId: '' });
  }

  function toggleDirector(directorId) {
    onPatchStyle({ directorId: style.directorId === directorId ? '' : directorId });
  }

  return (
    <div className="style-bible">
      <section className="bible-block">
        <h3 className="bible-block-title">视觉风格</h3>
        <div className="style-family-strip">
          {STYLE_FAMILIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`style-family-card ${family.id === item.id ? 'is-active' : ''}`}
              onClick={() => selectFamily(item.id)}
              disabled={readOnly}
              aria-pressed={family.id === item.id}
            >
              <b>{item.shortName}</b>
              <span className="style-family-colors" aria-hidden>
                {item.colors.map((color) => (
                  <i key={color} style={{ backgroundColor: color }} />
                ))}
              </span>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="bible-block">
        <h3 className="bible-block-title">配色比例</h3>
        <div className="palette-ruler">
          {family.colors.map((color, index) => (
            <div
              key={color}
              className="palette-sample"
              style={{
                flexGrow: PALETTE_WEIGHTS[index],
                backgroundColor: color,
                color: readableText(color),
              }}
            >
              <b>{PALETTE_ROLES[index]}</b>
              <small>{color}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="bible-block">
        <h3 className="bible-block-title">导演参照</h3>
        <div className="director-grid" data-count={directors.length}>
          {directors.map((director) => (
            <button
              key={director.id}
              type="button"
              className={`director-card ${
                style.directorId === director.id ? 'is-active' : ''
              }`}
              onClick={() => toggleDirector(director.id)}
              disabled={readOnly}
              aria-pressed={style.directorId === director.id}
            >
              <b>{director.name}</b>
              <span className="director-palette" aria-hidden>
                {director.palette.map((color) => (
                  <i key={color} style={{ backgroundColor: color }} />
                ))}
              </span>
              <small>{director.summary}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="bible-block">
        <h3 className="bible-block-title">生成目标</h3>
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
                disabled={readOnly}
                aria-pressed={style.targetId === target.id}
              >
                <Icon size={18} aria-hidden />
                <b>{target.label}</b>
                <small>{target.ratio}</small>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
