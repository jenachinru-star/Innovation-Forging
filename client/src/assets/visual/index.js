// 视觉页缩略图统一入口：图片已固化在本地，经 Vite 打包进 dist，离线可直接访问。
// 风格卡缩略图（family id -> 图片）
import cinematic from './style-cinematic.jpg';
import vintage from './style-vintage.jpg';
import dreamy from './style-dreamy.jpg';
import noir from './style-noir.jpg';
import fresh from './style-fresh.jpg';
import cyber from './style-cyber.jpg';
import western from './style-western.jpg';
import gothic from './style-gothic.jpg';
import nature from './style-nature.jpg';
import ad from './style-ad.jpg';

// 导演卡缩略图（director id -> 图片）
import directorWes from './director-wes.jpg';
import directorVilleneuve from './director-villeneuve.jpg';
import directorMiyazaki from './director-miyazaki.jpg';

// 生成工作台 6 张内置网格
import workStage from './work-stage.jpg';
import workBeams from './work-beams.jpg';
import workPortrait from './work-portrait.jpg';
import workDarkroom from './work-darkroom.jpg';
import workRainlane from './work-rainlane.jpg';
import workWindow from './work-window.jpg';

export const STYLE_THUMBS = {
  'cinematic-realism': cinematic,
  'vintage-film': vintage,
  'dreamy-glow': dreamy,
  'film-noir': noir,
  'japanese-fresh': fresh,
  cyberpunk: cyber,
  western,
  'gothic-dark': gothic,
  naturalism: nature,
  'commercial-ad': ad,
};

export const DIRECTOR_THUMBS = {
  'wes-anderson': directorWes,
  'denis-villeneuve': directorVilleneuve,
  'hayao-miyazaki': directorMiyazaki,
};

// 生成工作台内置示例网格（kind 与卡片徽章一致）
export const WORKBENCH_SAMPLES = [
  { id: 'sample-stage', title: '黄昏老戏台', kind: '场景', src: workStage },
  { id: 'sample-beams', title: '暖光木梁', kind: '场景', src: workBeams },
  { id: 'sample-portrait', title: '复古人物肖像', kind: '人物', src: workPortrait },
  { id: 'sample-darkroom', title: '幽暗室内', kind: '场景', src: workDarkroom },
  { id: 'sample-rainlane', title: '雨夜街巷', kind: '场景', src: workRainlane },
  { id: 'sample-window', title: '窗边剪影', kind: '人物', src: workWindow },
];
