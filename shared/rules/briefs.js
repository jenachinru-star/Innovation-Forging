export const DEPARTMENTS = ['lighting', 'musicSound', 'scenery'];

export const DEPARTMENT_LABELS = {
  lighting: '灯光',
  musicSound: '音乐音响',
  scenery: '舞美',
};

const KEYWORDS = {
  lighting: ['灯', '光', '定点', '面光', '侧光', '追光', '暖', '冷', '暗', '亮', '氛围'],
  musicSound: [
    '音乐',
    '配乐',
    '音效',
    '旋律',
    '渐入',
    '渐出',
    '歌',
    '曲',
    '雨声',
    '麦',
    '麦克风',
    '混响',
    '音量',
    '人声',
    '扩声',
  ],
  scenery: ['景', '置景', '道具', '服装', '化妆', '材质', '颜色', '幕布', '台口'],
};

function countKeywords(text, keywords) {
  return keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0);
}

function classify(segment) {
  let bestDepartment = 'uncertain';
  let bestScore = 0;
  for (const department of DEPARTMENTS) {
    const score = countKeywords(segment, KEYWORDS[department]);
    if (score > bestScore) {
      bestScore = score;
      bestDepartment = department;
    }
  }
  return bestScore > 0 ? bestDepartment : 'uncertain';
}

export function splitBrief(original, { sceneId = '', sceneNumber = null } = {}) {
  const text = typeof original === 'string' ? original : original == null ? '' : String(original);
  const normalizedSceneNumber =
    sceneNumber != null && sceneNumber !== '' && Number.isFinite(Number(sceneNumber))
      ? Number(sceneNumber)
      : null;
  const segments = text
    .split(/[；。，、]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.map((segment) => {
    const department = classify(segment);
    const uncertain = department === 'uncertain';
    return {
      id: '',
      department,
      sceneId,
      sceneNumber: normalizedSceneNumber,
      cueId: null,
      original: segment,
      items: uncertain ? [] : [segment],
      uncertain: uncertain ? [segment] : [],
      priority: 'medium',
      dueDate: null,
      status: 'draft',
      owner: '',
      note: '',
    };
  });
}
