// 视觉风格数据层：命名与配色 1:1 对齐暖棕金定妆板。
// 每个风格族含 5 个暖棕系颜色与 3 个关键词；导演参照为 3 位电影大师。
export const STYLE_FAMILIES = [
  {
    id: 'cinematic-realism',
    name: '电影感写实',
    shortName: '电影感写实',
    description: '暖棕金与胶片质感，用克制的写实用光让故事真实可信。',
    colors: ['#8B1E25', '#D4AF37', '#4A3A2A', '#2A6B7C', '#F5EFE6'],
    keywords: ['胶片质感', '暖金侧光', '写实'],
  },
  {
    id: 'vintage-film',
    name: '复古胶片',
    shortName: '复古胶片',
    description: '做旧颗粒与暖棕色调，营造怀旧、被时间浸润的影像。',
    colors: ['#4A3A2A', '#2B211A', '#C9A24B', '#E8DCC8', '#8C8073'],
    keywords: ['胶片颗粒', '做旧', '暖棕'],
  },
  {
    id: 'dreamy-glow',
    name: '梦幻柔光',
    shortName: '梦幻柔光',
    description: '柔焦高光与低反差暖光，把情绪包裹在朦胧的光晕里。',
    colors: ['#D8B45A', '#6B543C', '#F0E6D2', '#A99B88', '#FBF7F0'],
    keywords: ['柔焦', '低反差', '光晕'],
  },
  {
    id: 'film-noir',
    name: '黑色电影',
    shortName: '黑色电影',
    description: '硬边阴影与高反差明暗，在暗调里制造悬疑与宿命感。',
    colors: ['#15110D', '#2E241B', '#5A4632', '#9A8B78', '#F2EADB'],
    keywords: ['硬阴影', '高反差', '暗调'],
  },
  {
    id: 'japanese-fresh',
    name: '日系清新',
    shortName: '日系清新',
    description: '通透自然光与明亮留白，呈现清新、柔和的日常质感。',
    colors: ['#B23A33', '#D9B766', '#5E9AA0', '#7FA6C4', '#FAF6EE'],
    keywords: ['通透', '自然光', '留白'],
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    shortName: '赛博朋克',
    description: '暖金与冷青对撞，霓虹能量在深色城市里制造速度感。',
    colors: ['#C9A24B', '#C0473E', '#2A6B7C', '#3E6E94', '#7E8587'],
    keywords: ['霓虹', '冷暖对撞', '能量光'],
  },
  {
    id: 'western',
    name: '西部风情',
    shortName: '西部风情',
    description: '大漠尘土金与硬朗侧光，铺出粗犷、苍凉的荒原气质。',
    colors: ['#A8332A', '#6B4A30', '#D4AF37', '#33261B', '#F3EAD9'],
    keywords: ['尘土', '硬侧光', '苍凉'],
  },
  {
    id: 'gothic-dark',
    name: '哥特暗黑',
    shortName: '哥特暗黑',
    description: '深黑轮廓与暗红点缀，营造神秘、庄严的哥特氛围。',
    colors: ['#9E2A28', '#17120E', '#2E231A', '#574433', '#857A6B'],
    keywords: ['深黑', '暗红', '神秘'],
  },
  {
    id: 'naturalism',
    name: '自然主义',
    shortName: '自然主义',
    description: '大地色系与自然绿，让光线与环境本真地参与叙事。',
    colors: ['#5C4A35', '#6E8A6A', '#C9A862', '#8A6E4E', '#F4EEDF'],
    keywords: ['大地色', '自然绿', '本真'],
  },
  {
    id: 'commercial-ad',
    name: '商业广告',
    shortName: '商业广告',
    description: '精致高光与干净留白，突出质感、格调与产品的高级感。',
    colors: ['#D4AF37', '#EFE3CC', '#7A5C3E', '#E3C78A', '#FCF8F1'],
    keywords: ['精致', '高光', '留白'],
  },
];

export const DIRECTOR_STYLES = [
  {
    id: 'wes-anderson',
    name: '韦斯·安德森',
    familyId: 'vintage-film',
    summary: '对称构图与复古色彩，色彩规整、对称而浪漫。',
    palette: ['#D8B45A', '#B23A33', '#E8DCC8', '#7A5C3E', '#FBF7F0'],
  },
  {
    id: 'denis-villeneuve',
    name: '丹尼斯·维伦纽瓦',
    familyId: 'cinematic-realism',
    summary: '宏大叙事与光影诗意，光影深沉、史诗而神秘。',
    palette: ['#2E241B', '#5A4632', '#9A8570', '#C9A24B', '#E8DCC8'],
  },
  {
    id: 'hayao-miyazaki',
    name: '宫崎骏',
    familyId: 'naturalism',
    summary: '自然与治愈的温度，清新柔和、温暖治愈。',
    palette: ['#6E8A6A', '#7FB8C4', '#D9B766', '#B23A33', '#FAF6EE'],
  },
];

export const STYLE_TARGETS = [
  { id: 'character-sheet', label: '角色定妆板', ratio: '3:4' },
  { id: 'scene-plate', label: '场景概念图', ratio: '16:9' },
  { id: 'prop-sheet', label: '道具参考板', ratio: '1:1' },
  { id: 'keyframe', label: '分镜关键帧', ratio: '16:9' },
  { id: 'shot-video', label: '镜头视频', ratio: '16:9' },
  { id: 'poster', label: '作品海报', ratio: '3:4' },
];

export function familyById(id) {
  return STYLE_FAMILIES.find((family) => family.id === id) || STYLE_FAMILIES[0];
}

export function directorById(id) {
  return DIRECTOR_STYLES.find((director) => director.id === id) || null;
}

export function directorsForFamily(familyId) {
  return DIRECTOR_STYLES.filter((director) => director.familyId === familyId);
}

export function buildStylePrompt(style, subject = '人物与场景') {
  if (!style) return '';
  const director = directorById(style.directorId);
  const family = familyById(style.familyId);
  const palette = director?.palette || family.colors;
  const lines = [
    `视觉主体：${subject}`,
    `视觉族：${family.name}`,
    director ? `导演参照：${director.name}；${director.summary}` : family.description,
    `色彩结构：主色 ${palette[0]}（约 45%），辅色 ${palette[1]} / ${palette[2]}（约 35%），点缀 ${palette[3]}（约 10%），高光 ${palette[4]}（约 10%）`,
    `视觉关键词：${family.keywords.join('、')}`,
    '画面要求：保持人物身份、服装、场景和陈设连续；光线方向统一；避免无来源的装饰元素。',
  ];
  if (style.targetId === 'shot-video') {
    lines.push('镜头要求：写清起幅、落幅、景别、机位、运动方向和单镜时长；人物动作必须能在 4–15 秒内完成。');
  }
  return lines.join('\n');
}
