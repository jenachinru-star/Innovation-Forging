// 画布配色：与 index.css 中 stage-* 类的 CSS 变量取值保持一致。
// Konva 不读取 CSS 变量，这里集中维护，普通/白模两套。

const CUE = '#d4af37';
const SEAL = '#a8332a';

const BASE = {
  bg: '#18110d',
  frameFill: '#302419',
  frameStroke: '#b8a58c',
  mutedText: '#b8a58c',
  inkText: '#f7ede0',
  doorFill: '#302419',
  doorStroke: '#b8a58c',
  pathStroke: '#b39b73',
  objectFill: '#3a3026',
  objectStroke: '#756047',
  objectLabel: '#d8c9b1',
  actorFill: '#f7ede0',
  actorStroke: '#b8a58c',
  actorName: '#f2e6d3',
  actorCaption: '#bda98d',
  cue: CUE,
  seal: SEAL,
};

const WIRE = {
  ...BASE,
  bg: '#1a1a1a',
  frameFill: 'transparent',
  frameStroke: '#9a9a9a',
  doorFill: 'transparent',
  doorStroke: '#9a9a9a',
  actorFill: 'transparent',
  actorStroke: '#9a9a9a',
  objectFill: 'transparent',
  objectStroke: '#9a9a9a',
  objectLabel: '#b5b5b5',
  actorCaption: '#b5b5b5',
  mutedText: '#b5b5b5',
  pathStroke: '#b5b5b5',
};

export function themeFor(isWire) {
  return isWire ? WIRE : BASE;
}

export { CUE, SEAL };
