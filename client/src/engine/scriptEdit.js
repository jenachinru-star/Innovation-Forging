// 剧本编辑纯函数：行级类型转换、块插入、加台词、人物名补全提示。
// 全部为无副作用纯函数，便于单元测试；组件层负责光标与状态。

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function toChineseNum(n) {
  const value = Math.floor(Number(n));
  if (!Number.isFinite(value) || value <= 0) return '一';
  if (value < 10) return CN_DIGITS[value];
  if (value === 10) return '十';
  if (value < 20) return '十' + CN_DIGITS[value % 10];
  if (value < 100) {
    const ones = value % 10;
    return CN_DIGITS[Math.floor(value / 10)] + '十' + (ones ? CN_DIGITS[ones] : '');
  }
  // 解析器只认到「百」，1000 及以上直接用阿拉伯数字，保证写出的标题能被读回
  if (value >= 1000) return String(value);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  let out = CN_DIGITS[hundreds] + '百';
  if (rest === 0) return out;
  if (rest < 10) return out + '零' + CN_DIGITS[rest];
  return out + CN_DIGITS[Math.floor(rest / 10)] + '十' + (rest % 10 ? CN_DIGITS[rest % 10] : '');
}

export function countHeading(text, re) {
  const matched = String(text).match(re);
  return matched ? matched.length : 0;
}

// 去掉行的类型包装，还原出角色与纯内容
export function unwrapLine(line) {
  const t = String(line).trim();
  if (!t) return { content: '', speaker: '' };
  const direction = t.match(/^[（(]\s*([\s\S]*?)\s*[）)]$/);
  if (direction) return { content: direction[1], speaker: '' };
  const heading = t.match(/^第[零一二两三四五六七八九十百\d]+[幕场][\s：:、，,.\-—–]*([\s\S]*)$/);
  if (heading) return { content: heading[1].trim(), speaker: '', heading: t };
  const dialogue = t.match(/^([^：:]{1,12})[：:]([\s\S]*)$/);
  if (dialogue) return { speaker: dialogue[1].trim(), content: dialogue[2].trim() };
  return { content: t, speaker: '' };
}

export function transformLine(line, kind, ctx = {}) {
  const u = unwrapLine(line);
  if (kind === 'direction') {
    return u.content ? `（${u.content}）` : '（）';
  }
  if (kind === 'dialogue') {
    const speaker = u.speaker || ctx.defaultSpeaker || '人物';
    return u.content ? `${speaker}：${u.content}` : `${speaker}：`;
  }
  if (kind === 'scene') {
    const num = ctx.sceneNumber || 1;
    return u.content ? `第${toChineseNum(num)}场 ${u.content}` : `第${toChineseNum(num)}场 `;
  }
  if (kind === 'act') {
    const num = ctx.actNumber || 1;
    return `第${toChineseNum(num)}幕`;
  }
  return u.content;
}

export function lineRangeAt(doc, pos) {
  const safe = Math.max(0, Math.min(pos, doc.length));
  const start = doc.lastIndexOf('\n', Math.max(0, safe - 1)) + 1;
  let end = doc.indexOf('\n', safe);
  if (end === -1) end = doc.length;
  return { start, end };
}

export function lineIsEmpty(doc, pos) {
  const { start, end } = lineRangeAt(doc, pos);
  return doc.slice(start, end).trim() === '';
}

// 对光标所在行应用目标类型（选中文字时使用）
export function applyKindAtCursor(doc, pos, kind, ctx = {}) {
  const { start, end } = lineRangeAt(doc, pos);
  const line = doc.slice(start, end);
  const transformed = transformLine(line, kind, ctx);
  const text = doc.slice(0, start) + transformed + doc.slice(end);
  return {
    text,
    cursor: start + transformed.length,
    lineStart: start,
    lineEnd: start + transformed.length,
  };
}

// 在光标处插入新块，自动处理换行，保证新块始终独占一行
export function insertBlock(doc, selStart, selEnd, snippet, cursorFromEnd = 0) {
  const beforeRaw = doc.slice(0, selStart);
  const after = doc.slice(selEnd);
  // 光标位于行中间时，在块前补换行；光标位于行首且后面有内容时，在块后补换行
  const leadNewline = beforeRaw.length > 0 && !beforeRaw.endsWith('\n') ? '\n' : '';
  const trailNewline = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
  const before = beforeRaw + leadNewline;
  const text = before + snippet + trailNewline + after;
  const cursor = (before + snippet).length - cursorFromEnd;
  return { text, cursor };
}

// 为指定角色插入一句对白
export function insertDialogue(doc, selStart, selEnd, speaker) {
  return insertBlock(doc, selStart, selEnd, `${speaker}：`, 0);
}

// 取光标处正在输入的词（仅当该行尚未出现冒号），用于人物名补全
export function currentTokenAt(doc, pos) {
  const { start } = lineRangeAt(doc, pos);
  const head = doc.slice(start, pos);
  if (/[：:]/.test(head)) return null;
  const matched = head.match(/([一-龥A-Za-z0-9]{0,12})$/);
  if (!matched) return null;
  return { token: matched[1], start: pos - matched[1].length, end: pos };
}

export function suggestCharacters(part, names) {
  const q = (part || '').trim();
  const list = names || [];
  if (!q) return list.slice(0, 6);
  return list.filter((n) => n.includes(q)).slice(0, 6);
}
