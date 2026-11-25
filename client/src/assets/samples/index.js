// 内置示例图片的统一入口（图片已固化在本地，离线 dist 可直接访问）。
import charChen from './char-chen.png';
import charLan from './char-lan.png';
import charZhou from './char-zhou.png';

import sceneLivingroom from './scene-livingroom.png';
import sceneDoorway from './scene-doorway.png';
import sceneKey from './scene-key.png';

import coverYeye from './cover-yeyeguiren.png';
import coverChunshan1 from './cover-chunshan-1.png';
import coverChunshan2 from './cover-chunshan-2.png';
import coverXiyu from './cover-xiyurensheng.png';
import coverWanmo from './cover-wanmo.png';
import coverFengshengren from './cover-fengshengren.png';
import coverFengzhong from './cover-fengzhongdexin.png';
import coverRiguang from './cover-riguangzhixia.png';

// 人物名 -> 形象图（人物名与 shared/samples/oneAct 保持一致）
export const CHARACTER_IMAGE = {
  老陈: charChen,
  阿岚: charLan,
  老周: charZhou,
};

// 视觉制作页的内置场景图
export const SCENE_IMAGES = [
  { id: 'scene-livingroom', title: '客厅 · 夜', kind: '场景', src: sceneLivingroom },
  { id: 'scene-doorway', title: '楼道 · 雨', kind: '场景', src: sceneDoorway },
  { id: 'scene-key', title: '钥匙 · 交接', kind: '场景', src: sceneKey },
];

// 作品库封面（按文件名导出，供示例作品数据引用）
export const COVERS = {
  yeye: coverYeye,
  chunshan1: coverChunshan1,
  chunshan2: coverChunshan2,
  xiyu: coverXiyu,
  wanmo: coverWanmo,
  fengshengren: coverFengshengren,
  fengzhong: coverFengzhong,
  riguang: coverRiguang,
};
