// 零依赖剧本高亮：把纯文本按行分类，渲染成带语义 class 的 HTML。
// 架构参考 react-simple-code-editor（透明 textarea + 高亮层叠加），高亮规则自写。

export const SPEAKER_PALETTE = [
  '#d8b48c',
  '#c98a86',
  '#b0a495',
  '#c9a86a',
  '#9fb0a0',
  '#a89bb5',
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function tokenizeLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'empty' };
  if (/^第[一二三四五六七八九十百\d]+幕/.test(trimmed)) return { type: 'act' };
  if (/^第[一二三四五六七八九十百\d]+场/.test(trimmed)) return { type: 'scene' };
  if (/^(?:人物|角色)\s*[:：]/.test(trimmed)) return { type: 'cast' };
  if (/^【场景】/.test(trimmed)) return { type: 'metaScene', text: trimmed.slice(4) };
  if (/^【人物】/.test(trimmed)) return { type: 'metaCharacter', text: trimmed.slice(4) };
  if (/^[（(]/.test(trimmed)) return { type: 'direction' };
  const match = trimmed.match(
    /^([^\s：:，。！？、；（）()【】《》“”‘’"'…—]{1,12})[：:](.*)$/
  );
  if (match) return { type: 'dialogue', speaker: match[1], rest: match[2] };
  return { type: 'other' };
}

export function highlightScript(source) {
  const lines = String(source ?? '').split('\n');
  const speakerColors = new Map();

  function colorFor(speaker) {
    if (!speakerColors.has(speaker)) {
      speakerColors.set(speaker, SPEAKER_PALETTE[speakerColors.size % SPEAKER_PALETTE.length]);
    }
    return speakerColors.get(speaker);
  }

  return lines
    .map((line) => {
      const token = tokenizeLine(line);
      const safe = escapeHtml(line.trim());
      switch (token.type) {
        case 'empty':
          return '<span class="hl-line hl-empty"></span>';
        case 'act':
          return `<span class="hl-line hl-act">${safe}</span>`;
        case 'scene':
          return `<span class="hl-line hl-scene">${safe}</span>`;
        case 'cast':
          return `<span class="hl-line hl-cast">${safe}</span>`;
        case 'metaScene':
          return `<span class="hl-line"><span class="hl-tag">【场景】</span>${escapeHtml(token.text)}</span>`;
        case 'metaCharacter':
          return `<span class="hl-line"><span class="hl-tag is-char">【人物】</span>${escapeHtml(token.text)}</span>`;
        case 'direction':
          return `<span class="hl-line hl-direction">${safe}</span>`;
        case 'dialogue': {
          const color = colorFor(token.speaker);
          return (
            `<span class="hl-line"><span class="hl-speaker" style="color:${color}">` +
            `${escapeHtml(token.speaker)}</span><span class="hl-colon">：</span>${escapeHtml(token.rest)}</span>`
          );
        }
        default:
          return `<span class="hl-line">${escapeHtml(line)}</span>`;
      }
    })
    .join('');
}
