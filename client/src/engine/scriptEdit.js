// 剧本编辑纯函数：行级类型转换、块插入、加台词、人物名补全提示。
// 全部为无副作用纯函数，便于单元测试；组件层负责光标与状态。

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function toChineseNum(n) {
  if (n <= 0) return '一';
  if (n < 10) return CN_DIGITS[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + CN_DIGITS[n % 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return CN_DIGITS[tens] + '十' + (ones ? CN_DIGITS[ones] : '');
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
  const dialogue = t.match(/^([^：:]{1,12})[：:]([\s\S]*)$/);
  if (dialogue) return { speaker: dialogue[1].trim(), content: dialogue[2].trim() };
  const heading = t.match(/^第[一二三四五六七八九十百\d]+[幕场]\s*([\s\S]*)$/);
  if (heading) return { content: heading[1].trim(), speaker: '', heading: t };
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
