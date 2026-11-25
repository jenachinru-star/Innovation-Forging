import { createEmptyProductionPlan } from '@director/shared';
import { SAMPLE_TEXT, SAMPLE_SCRIPT_DATA } from '@director/shared/samples/oneAct.js';
import { CHARACTER_IMAGE } from '../assets/samples/index.js';

const firstScene = SAMPLE_SCRIPT_DATA.scenes[0];
const secondScene = SAMPLE_SCRIPT_DATA.scenes[1];

const plan = {
  ...createEmptyProductionPlan('stage', '钥匙（示例）'),
  cues: [
    {
      id: 'cue-demo-1',
      department: 'lighting',
      sceneId: firstScene.id,
      sceneNumber: firstScene.sceneNumber,
      anchor: null,
      trigger: { type: 'line', quote: '你终于回来了', offset: null },
      content: '暖光渐亮，落在桌上的钥匙上',
      status: 'confirmed',
      note: '示例提示',
      timecode: 35,
    },
    {
      id: 'cue-demo-3',
      department: 'music',
      sceneId: firstScene.id,
      sceneNumber: firstScene.sceneNumber,
      anchor: null,
      trigger: { type: 'free', quote: '', offset: null },
      content: '轻柔底乐渐入，烘托父女重逢',
      status: 'draft',
      note: '',
      timecode: 70,
    },
    {
      id: 'cue-demo-4',
      department: 'lighting',
      sceneId: firstScene.id,
      sceneNumber: firstScene.sceneNumber,
      anchor: null,
      trigger: { type: 'action', quote: '老陈把钥匙放进阿岚手心', offset: null },
      content: '定点光打亮交接的钥匙',
      status: 'draft',
      note: '',
      timecode: 150,
    },
    {
      id: 'cue-demo-2',
      department: 'sound',
      sceneId: secondScene.id,
      sceneNumber: secondScene.sceneNumber,
      anchor: null,
      trigger: { type: 'free', quote: '', offset: null },
      content: '雨声渐起，楼道灯忽明忽暗',
      status: 'draft',
      note: '',
      timecode: 200,
    },
  ],
  briefs: [
    {
      id: 'brief-demo-1',
      department: 'music',
      sceneId: firstScene.id,
      sceneNumber: firstScene.sceneNumber,
      cueId: null,
      original: '灯光转暖时配合轻柔底乐',
      items: ['轻柔底乐渐入'],
      uncertain: [],
      priority: 'medium',
      dueDate: '',
      status: 'draft',
      owner: '',
      note: '示例部门需求',
    },
  ],
  assets: [
    {
      id: 'asset-chen',
      type: 'character',
      characterName: '老陈',
      status: 'selected',
      url: CHARACTER_IMAGE.老陈,
    },
    {
      id: 'asset-lan',
      type: 'character',
      characterName: '阿岚',
      status: 'selected',
      url: CHARACTER_IMAGE.阿岚,
    },
    {
      id: 'asset-zhou',
      type: 'character',
      characterName: '老周',
      status: 'selected',
      url: CHARACTER_IMAGE.老周,
    },
  ],
  staging: {
    stage: null,
    placements: [
      { sceneNumber: firstScene.sceneNumber, characterId: '老陈', x: 250, y: 300 },
      { sceneNumber: firstScene.sceneNumber, characterId: '阿岚', x: 520, y: 320 },
    ],
    objects: [
      {
        id: 'object-demo-1',
        kind: 'table',
        label: '桌',
        sceneNumber: firstScene.sceneNumber,
        x: 380,
        y: 250,
        rotation: 0,
        scale: 1,
      },
    ],
    paths: [
      {
        id: 'path-demo-lan',
        sceneNumber: firstScene.sceneNumber,
        characterId: '阿岚',
        triggerQuote: '',
        points: [
          { x: 520, y: 320 },
          { x: 460, y: 280 },
          { x: 380, y: 268 },
          { x: 300, y: 300 },
        ],
      },
      {
        id: 'path-demo-chen',
        sceneNumber: firstScene.sceneNumber,
        characterId: '老陈',
        triggerQuote: '',
        points: [
          { x: 250, y: 300 },
          { x: 280, y: 250 },
          { x: 330, y: 224 },
        ],
      },
    ],
    notes: [],
  },
};

// 演示专用：在共享样例基础上补人物关系，让关系图可渲染（不修改共享样例）
const demoScriptData = {
  ...SAMPLE_SCRIPT_DATA,
  relationships: [
    { from: '老陈', to: '阿岚', relation: '父女', needsReview: false },
    { from: '老周', to: '老陈', relation: '老友', needsReview: false },
    { from: '老周', to: '阿岚', relation: '熟识', needsReview: true },
  ],
};

// 只读演示用的完整作品（结构与后端保存的作品一致）
export const demoProject = {
  id: 'demo-project',
  name: '钥匙 · 示例作品',
  summary: SAMPLE_SCRIPT_DATA.summary || '',
  step: 'result',
  activeNav: 'overview',
  activeTab: 'schedule',
  scriptText: SAMPLE_TEXT,
  scriptVersions: [],
  scriptData: demoScriptData,
  plan,
};

export { demoScriptData, SAMPLE_TEXT as demoScriptText };
