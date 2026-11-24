export const STYLE_FAMILIES = [
  {
    id: 'noir',
    name: '黑色悬疑与冷调惊悚',
    shortName: '冷调惊悚',
    description: '压低环境亮度，用克制的中性色和单点警示色制造不安。',
    colors: ['#151413', '#4A4945', '#B8ADA0', '#35634C', '#B43B33'],
    keywords: ['硬边阴影', '低饱和', '警示点缀'],
  },
  {
    id: 'neon',
    name: '霓虹黑色与赛博未来',
    shortName: '霓虹未来',
    description: '深底色上使用青蓝、洋红和能量光，建立城市速度与技术感。',
    colors: ['#10131B', '#263247', '#27A9B2', '#D74D63', '#E7D4B2'],
    keywords: ['霓虹', '冷蓝反射', '高反差'],
  },
  {
    id: 'earth',
    name: '大地暖调与自然光诗意',
    shortName: '自然诗意',
    description: '沙金、橄榄与柔光米色层层过渡，让光线参与叙事。',
    colors: ['#4B4536', '#7F875D', '#B88A58', '#D8C49D', '#E8DED0'],
    keywords: ['自然光', '尘土金', '慢溶'],
  },
  {
    id: 'minimal',
    name: '极简冷构与静观长镜',
    shortName: '静观构作',
    description: '低密度构图、长时间凝视和克制的灰蓝色，强调空间与沉默。',
    colors: ['#DAD8D2', '#A6AAAE', '#6B747A', '#374047', '#1A1B1D'],
    keywords: ['留白', '固定机位', '冷灰'],
  },
  {
    id: 'baroque',
    name: '巴洛克华丽与浓墨重彩',
    shortName: '华丽浓彩',
    description: '深红、金箔、宝石色与戏剧性光源共同构成仪式感。',
    colors: ['#350D14', '#7F3340', '#B68A4C', '#E0C892', '#1F3435'],
    keywords: ['金箔', '舞台光', '装饰密度'],
  },
  {
    id: 'surreal',
    name: '超现实梦幻与心理畸变',
    shortName: '超现实梦境',
    description: '不稳定空间、异色光线和陌生比例把情绪推到现实之外。',
    colors: ['#342843', '#705D82', '#C59382', '#41545C', '#D8C8B8'],
    keywords: ['梦境', '畸变空间', '异色光'],
  },
  {
    id: 'action',
    name: '动作史诗与高饱和色彩',
    shortName: '动作史诗',
    description: '硬侧光、烟尘、速度线与高饱和主色形成清晰的行动方向。',
    colors: ['#251B18', '#A44B26', '#DA6D2B', '#24445B', '#E7B86D'],
    keywords: ['硬侧光', '烟尘', '高速运动'],
  },
  {
    id: 'animation',
    name: '动画奇幻与异想视觉',
    shortName: '奇幻动画',
    description: '清晰色块、夸张形体与可读的明暗关系构成童话般的空间。',
    colors: ['#1F3545', '#3F7F84', '#C94E64', '#F0BF5B', '#F3E5C4'],
    keywords: ['色块', '夸张比例', '高可读性'],
  },
  {
    id: 'romance',
    name: '浪漫柔光与复古色调',
    shortName: '柔光复古',
    description: '柔焦、低反差与温暖肤色创造亲密、怀旧的观看距离。',
    colors: ['#E9D8C7', '#C99582', '#9C665B', '#6C4A45', '#F2E5AD'],
    keywords: ['柔焦', '暖肤色', '轻颗粒'],
  },
  {
    id: 'eastern',
    name: '东方美学与留白意境',
    shortName: '东方留白',
    description: '用不对称构图、呼吸般的空白与低动作密度让环境成为叙事者。',
    colors: ['#EEE9DE', '#B9B2A4', '#707C76', '#B34639', '#202525'],
    keywords: ['留白', '框景', '低机位'],
  },
];

export const DIRECTOR_STYLES = [
  {
    id: 'alfred-hitchcock',
    name: '希区柯克',
    familyId: 'noir',
    summary: '优雅中性色被翠绿和警示红刺破，颜色成为危险开关。',
    palette: ['#1A1918', '#6D6D65', '#BDB7AA', '#2F6450', '#B1332E'],
  },
  {
    id: 'david-fincher',
    name: '大卫·芬奇',
    familyId: 'noir',
    summary: '黄绿阴影、冷灰建筑和压抑钨光构成精密的犯罪病理。',
    palette: ['#111312', '#34413A', '#758078', '#A5AA9C', '#B89D62'],
  },
  {
    id: 'denis-villeneuve',
    name: '维伦纽瓦',
    familyId: 'noir',
    summary: '沙金、巨构灰和深青蓝用单一主色控制宏大空间。',
    palette: ['#12181C', '#40555E', '#8A8073', '#C29B65', '#E3D4BA'],
  },
  {
    id: 'wong-kar-wai',
    name: '王家卫',
    familyId: 'neon',
    summary: '饱和红绿、狭窄空间和运动残影共同表达都市里的错过。',
    palette: ['#17100D', '#6B1D22', '#B43B3B', '#1F6D62', '#D8A446'],
  },
  {
    id: 'park-chan-wook',
    name: '朴赞郁',
    familyId: 'neon',
    summary: '精密对称里的浓郁色块与冷静暴力形成危险的秩序。',
    palette: ['#13171D', '#31566A', '#738F8B', '#B21F37', '#D7B87A'],
  },
  {
    id: 'terrence-malick',
    name: '泰伦斯·马力克',
    familyId: 'earth',
    summary: '逆光、黄金时刻和自然元素把人物放进流动的时间。',
    palette: ['#3E3A2C', '#74724A', '#A88B57', '#D9B975', '#E7D9BC'],
  },
  {
    id: 'ang-lee',
    name: '李安',
    familyId: 'earth',
    summary: '克制的自然光与均衡构图承载家庭、身体和文化的张力。',
    palette: ['#272421', '#645B4E', '#A58D70', '#CABCA5', '#6D8179'],
  },
  {
    id: 'andrei-tarkovsky',
    name: '塔可夫斯基',
    familyId: 'minimal',
    summary: '低饱和自然材质、长镜与潮湿空间让时间留下触感。',
    palette: ['#232522', '#4D5548', '#7D806D', '#A49A82', '#C5BBAA'],
  },
  {
    id: 'bela-tarr',
    name: '贝拉·塔尔',
    familyId: 'minimal',
    summary: '黑白灰层次、长镜头和空旷环境把重量交给等待。',
    palette: ['#111111', '#3A3A38', '#74736E', '#B1ADA4', '#E0DDD5'],
  },
  {
    id: 'federico-fellini',
    name: '费里尼',
    familyId: 'baroque',
    summary: '梦境般的舞台调度、华丽服装与夸张面孔共同制造嘉年华。',
    palette: ['#361319', '#853447', '#C49455', '#E7CFA1', '#294149'],
  },
  {
    id: 'francis-ford-coppola',
    name: '科波拉',
    familyId: 'baroque',
    summary: '金色、酒红和深黑在明暗对照中构成家庭与权力的祭坛。',
    palette: ['#140F0C', '#4A201D', '#8B4B32', '#BE9458', '#E0CFAF'],
  },
  {
    id: 'zhang-yimou',
    name: '张艺谋',
    familyId: 'baroque',
    summary: '强色彩区块和仪式化群像把空间变成视觉宣言。',
    palette: ['#2A0708', '#8A1717', '#C93122', '#D6A34A', '#E7DBC6'],
  },
  {
    id: 'stanley-kubrick',
    name: '库布里克',
    familyId: 'surreal',
    summary: '精确透视、单一消失点和不对称色彩制造理性中的失控。',
    palette: ['#171717', '#4A4B48', '#B6A88D', '#8B3030', '#D6D3CA'],
  },
  {
    id: 'bi-gan',
    name: '毕赣',
    familyId: 'surreal',
    summary: '潮湿绿、霓虹残光与记忆轨迹让现实和梦境没有硬边界。',
    palette: ['#101A18', '#24504B', '#648C77', '#AA3F3C', '#C9A968'],
  },
  {
    id: 'tim-burton',
    name: '蒂姆·伯顿',
    familyId: 'surreal',
    summary: '哥特轮廓、灰蓝天空和高饱和怪诞细节形成童话暗面。',
    palette: ['#191C25', '#3E4857', '#77838A', '#A74A57', '#C9B77A'],
  },
  {
    id: 'akira-kurosawa',
    name: '黑泽明',
    familyId: 'action',
    summary: '天气、运动和硬朗构图把人性的冲突推到史诗尺度。',
    palette: ['#1C1917', '#5A5146', '#9E8B70', '#B34C32', '#D8CAB3'],
  },
  {
    id: 'john-woo',
    name: '吴宇森',
    familyId: 'action',
    summary: '冷蓝与火光并置，慢动作和双枪动作构成浪漫暴力。',
    palette: ['#101823', '#294962', '#587D91', '#C6533C', '#E2BC77'],
  },
  {
    id: 'hayao-miyazaki',
    name: '宫崎骏',
    familyId: 'animation',
    summary: '清澈天空、繁盛自然和温暖人物色构成可栖居的奇幻世界。',
    palette: ['#24495D', '#73A5AE', '#8B9C57', '#E5C86A', '#EEE0C9'],
  },
  {
    id: 'satoshi-kon',
    name: '今敏',
    familyId: 'animation',
    summary: '现实与媒介空间相互折叠，用高饱和色块制造心理错位。',
    palette: ['#1B1E29', '#5B406C', '#B64763', '#D68043', '#D8C35C'],
  },
  {
    id: 'wes-anderson',
    name: '韦斯·安德森',
    familyId: 'animation',
    summary: '对称构图与糖果色系统把人物放进精致但疏离的模型盒。',
    palette: ['#2F1F16', '#B86D52', '#E3B67D', '#8AA9A0', '#E9DCC5'],
  },
  {
    id: 'eric-rohmer',
    name: '埃里克·侯麦',
    familyId: 'romance',
    summary: '自然肤色、明亮日常色和放松构图让对话和关系自然发生。',
    palette: ['#E3D2BF', '#C88978', '#9C6156', '#5F6F69', '#F0E5B9'],
  },
  {
    id: 'sofia-coppola',
    name: '索菲亚·科波拉',
    familyId: 'romance',
    summary: '轻盈粉彩、柔光和静止空间表达亲密、疏离与微妙权力。',
    palette: ['#F1DFD3', '#D8A7A1', '#9C7774', '#75615D', '#EEDCB3'],
  },
  {
    id: 'yasujiro-ozu',
    name: '小津安二郎',
    familyId: 'eastern',
    summary: '低机位、稳定构图和克制的室内色让日常细节承载变化。',
    palette: ['#EAE6DB', '#B3AC9F', '#7F8177', '#5A5E58', '#B5473B'],
  },
  {
    id: 'edward-yang',
    name: '杨德昌',
    familyId: 'eastern',
    summary: '冷静空间、城市玻璃和夜晚光把个体放回社会结构。',
    palette: ['#1E2326', '#45555A', '#7E8987', '#B7AD98', '#9B3D35'],
  },
];

export const STYLE_TARGETS = [
  { id: 'character-sheet', label: '角色定妆板', ratio: '3:4' },
  { id: 'scene-plate', label: '场景概念图', ratio: '16:9' },
  { id: 'prop-sheet', label: '道具参考板', ratio: '1:1' },
  { id: 'keyframe', label: '分镜关键帧', ratio: '16:9' },
  { id: 'shot-video', label: '镜头视频提示', ratio: '16:9 · 4–15s' },
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
