import { createEmptyProductionPlan } from '@director/shared';
import { SAMPLE_TEXT, SAMPLE_SCRIPT_DATA } from '@director/shared/samples/oneAct.js';

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
  scriptData: SAMPLE_SCRIPT_DATA,
  plan,
};

export { SAMPLE_SCRIPT_DATA as demoScriptData, SAMPLE_TEXT as demoScriptText };
