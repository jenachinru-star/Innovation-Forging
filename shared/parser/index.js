import { normalizeScriptData } from '../index.js';
import { uid } from '../id.js';

const ACT_RE = /^第[零一二两三四五六七八九十百\d]+幕/;
const SCENE_RE = /^第[零一二两三四五六七八九十百\d]+场\s*(.*)$/;
const SCENE_NUM_RE = /^第([零一二两三四五六七八九十百\d]+)场/;
const CUE_RE = /^([^\s：:，。！？、；（）()【】《》“”‘’"'…—]{1,12})[：:]\s*(.+)$/;
const DIR_RE = /^[（(【].*[）)】]$/;
const CAST_RE = /^(?:人物|角色)\s*[：:]\s*(.+)$/;

// 话剧舞台排版：角色名（内部可含排版空格）+ 两个及以上空格 + 台词
const STAGE_CUE_RE = /^([一-龥]{1,4}(?:\s+[一-龥]{1,4}){0,2})\s{2,}(\S.*)$/;
// 景行：「景」+ 可选分隔符 + 地点描述
const JING_RE = /^景\s*[—–\-：:、，,．.]*\s*(.*)$/;
// 仅以括号开头的动作行（允许括号不闭合）
const OPEN_DIR_RE = /^[【（(]/;
// 台词开头的语气/动作圆括号
const LEADING_PAREN_RE = /^[（(]([^（）()]*)[）)]\s*/;
// 动作行中提示某角色开始说话
const SPEAK_VERB_RE = /(说话|讲述|诉说|独白|喃喃|自语|开口|说道|念叨)/;

const PROPS = ['钥匙', '信件', '信', '信纸', '钱', '酒', '酒瓶', '照片', '手机', '伞', '箱子', '灯', '花', '书', '药'];

const CN_DIGITS = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const CN_UNITS = { 十: 10, 百: 100 };

function cnToNumber(str) {
  const s = String(str || '');
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  let section = 0;
  let number = 0;
  for (const ch of s) {
    if (Object.prototype.hasOwnProperty.call(CN_DIGITS, ch)) {
      number = CN_DIGITS[ch];
    } else if (Object.prototype.hasOwnProperty.call(CN_UNITS, ch)) {
      const unit = CN_UNITS[ch];
      if (number === 0) number = 1;
      section += number * unit;
      number = 0;
    }
  }
  return section + number;
}

// 去掉标题编号后紧跟的分隔符，如「第一场：客厅」「第二幕 - 夜」
function stripHeadingSeparator(str) {
  return String(str || '').replace(/^[\s：:、，,.\-—–]+/, '').trim();
}

function splitNames(str) {
  return String(str || '')
    .split(/[、，,／/\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// 去掉角色名内部的排版空格，如「林   越」→「林越」
function normalizeName(raw) {
  return String(raw || '').replace(/\s+/g, '').trim();
}

function splitLines(rawText) {
  const result = [];
  let pos = 0;
  const len = rawText.length;
  while (pos <= len) {
    const nl = rawText.indexOf('\n', pos);
    if (nl === -1) {
      if (pos < len) {
        result.push(makeLine(rawText.slice(pos), pos));
      }
      break;
    }
    result.push(makeLine(rawText.slice(pos, nl), pos));
    pos = nl + 1;
  }
  return result;
}

function makeLine(text, start) {
  const content = text.replace(/\r$/, '');
  const leading = content.length - content.trimStart().length;
  return { text: content, start, contentStart: start + leading };
}

export function parseScriptOffline(rawTextInput) {
  const warnings = [];
  const rawText = typeof rawTextInput === 'string' ? rawTextInput : '';
  const lines = splitLines(rawText);

  const headerCandidates = new Set();
  const allCharacterOrder = [];
  const allCharacterSet = new Set();
  const addCharacter = (name) => {
    const n = normalizeName(name);
    if (n && !allCharacterSet.has(n)) {
      allCharacterSet.add(n);
      allCharacterOrder.push(n);
    }
  };

  // 第一遍：建立角色候选表
  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    if (ACT_RE.test(t) || SCENE_RE.test(t) || JING_RE.test(t)) continue;
    const cast = t.match(CAST_RE);
    if (cast) {
      for (const name of splitNames(cast[1])) {
        const n = normalizeName(name);
        headerCandidates.add(n);
        addCharacter(n);
      }
      continue;
    }
    const stage = t.match(STAGE_CUE_RE);
    if (stage) {
      const stageName = normalizeName(stage[1]);
      headerCandidates.add(stageName);
      addCharacter(stageName);
      continue;
    }
    const cue = t.match(CUE_RE);
    if (cue) addCharacter(cue[1]);
  }

  const scenes = [];
  const acts = [];
  const usedSceneNumbers = new Set();
  let currentAct = null;
  let currentScene = null;
  let sceneCounter = 0;
  let actCounter = 0;
  let currentLineRef = null;
  let pendingSpeaker = null;
  let jingMode = false;

  const scanProps = (value, allowSingleChar = false) => {
    if (!currentScene) return;
    for (const prop of PROPS) {
      if (!allowSingleChar && prop.length < 2) continue;
      if (value.includes(prop) && !currentScene._propSet.has(prop)) {
        currentScene._propSet.add(prop);
        currentScene._propOrder.push(prop);
      }
    }
  };

  const finalizeScene = (endOffset) => {
    if (!currentScene) return;
    const scene = currentScene;
    let end = Number.isFinite(endOffset) ? endOffset : rawText.length;
    if (end < scene.rawRange.start) end = scene.rawRange.start;
    scene.rawRange.end = end;

    scene.characters = scene._speakers.slice();

    const present = [];
    const presentSet = new Set();
    for (const name of scene._speakers) {
      if (!presentSet.has(name)) {
        presentSet.add(name);
        present.push(name);
      }
    }
    for (const dir of scene.stageDirections) {
      for (const name of allCharacterOrder) {
        if (!presentSet.has(name) && dir.includes(name)) {
          presentSet.add(name);
          present.push(name);
        }
      }
    }
    scene.presentCharacters = present;
    scene.props = scene._propOrder.slice();
    scene.estimatedMinutes = Math.max(1, Math.ceil(scene._dialogueChars / 250));

    if (!scene.location) {
      warnings.push(`第${scene.sceneNumber}场未标注场景（景），请补全地点`);
    }

    delete scene._speakers;
    delete scene._speakerSet;
    delete scene._propOrder;
    delete scene._propSet;
    delete scene._dialogueChars;

    if (currentAct) currentAct.sceneIds.push(scene.id);
    scenes.push(scene);
    currentScene = null;
    currentLineRef = null;
    pendingSpeaker = null;
  };

  const openDialogue = (name, text, start) => {
    let body = String(text || '');
    const lead = body.match(LEADING_PAREN_RE);
    if (lead) body = body.slice(lead[0].length);
    body = body.trim();
    if (!currentScene._speakerSet.has(name)) {
      currentScene._speakerSet.add(name);
      currentScene._speakers.push(name);
    }
    const line = { id: uid(), speaker: name, text: body, offset: start };
    currentScene.lines.push(line);
    currentScene._dialogueChars += body.length;
    scanProps(body);
    currentLineRef = line;
    return line;
  };

  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;

    const actMatch = t.match(ACT_RE);
    if (actMatch) {
      finalizeScene(line.contentStart - 1);
      const numStr = actMatch[0].replace(/^第/, '').replace(/幕$/, '');
      let actNumber = cnToNumber(numStr);
      if (!actNumber) {
        actNumber = ++actCounter;
      } else if (actNumber > actCounter) {
        actCounter = actNumber;
      }
      const title = stripHeadingSeparator(t.slice(actMatch[0].length));
      currentAct = { id: uid(), actNumber, title, sceneIds: [] };
      acts.push(currentAct);
      jingMode = false;
      continue;
    }

    const sceneMatch = t.match(SCENE_RE);
    if (sceneMatch) {
      finalizeScene(line.contentStart - 1);
      const numStr = (t.match(SCENE_NUM_RE) || [])[1] || '';
      let sceneNumber = cnToNumber(numStr);
      if (!sceneNumber || usedSceneNumbers.has(sceneNumber)) {
        sceneNumber = ++sceneCounter;
      } else if (sceneNumber > sceneCounter) {
        sceneCounter = sceneNumber;
      }
      usedSceneNumbers.add(sceneNumber);
      const location = stripHeadingSeparator(sceneMatch[1]);
      currentScene = {
        id: uid(),
        sceneNumber,
        title: t,
        location,
        characters: [],
        presentCharacters: [],
        props: [],
        stageDirections: [],
        lines: [],
        summary: '',
        estimatedMinutes: 0,
        rawRange: { start: line.contentStart, end: rawText.length },
        actId: currentAct ? currentAct.id : null,
        _speakers: [],
        _speakerSet: new Set(),
        _propOrder: [],
        _propSet: new Set(),
        _dialogueChars: 0,
      };
      currentLineRef = null;
      pendingSpeaker = null;
      jingMode = false;
      continue;
    }

    if (CAST_RE.test(t)) continue;

    // 景行
    const jing = t.match(JING_RE);
    if (jing && currentScene) {
      currentScene.location = jing[1].trim();
      currentLineRef = null;
      pendingSpeaker = null;
      jingMode = true;
      continue;
    }

    if (!currentScene) continue;

    // 动作行（闭合或不闭合）
    if (DIR_RE.test(t) || OPEN_DIR_RE.test(t)) {
      currentScene.stageDirections.push(t);
      scanProps(t, true);
      currentLineRef = null;
      pendingSpeaker = null;
      if (SPEAK_VERB_RE.test(t)) {
        const found = allCharacterOrder.filter((n) => t.includes(n));
        if (found.length === 1) pendingSpeaker = found[0];
      }
      jingMode = false;
      continue;
    }

    // 话剧排版台词
    const stage = t.match(STAGE_CUE_RE);
    if (stage) {
      const name = normalizeName(stage[1]);
      if (!headerCandidates.has(name)) {
        warnings.push(`台词人物「${name}」不在候选表，已按台词处理`);
      }
      openDialogue(name, stage[2], line.start);
      pendingSpeaker = null;
      jingMode = false;
      continue;
    }

    // 冒号台词
    const cue = t.match(CUE_RE);
    if (cue) {
      const name = normalizeName(cue[1]);
      if (!headerCandidates.has(name)) {
        warnings.push(`台词人物「${name}」不在候选表，已按台词处理`);
      }
      openDialogue(name, cue[2], line.start);
      pendingSpeaker = null;
      jingMode = false;
      continue;
    }

    // 无主续行
    if (jingMode && currentScene.location) {
      currentScene.location += t;
      continue;
    }
    if (currentLineRef) {
      currentLineRef.text += t;
      currentScene._dialogueChars += t.length;
      scanProps(t);
      continue;
    }
    if (pendingSpeaker) {
      openDialogue(pendingSpeaker, t, line.start);
      pendingSpeaker = null;
      continue;
    }
    // 其余噪声（封面、页码、全剧终等）忽略
  }

  finalizeScene(rawText.length);

  if (scenes.length === 0) {
    warnings.push('未识别到任何场次');
  }

  const raw = {
    summary: '',
    scenes,
    characters: allCharacterOrder.map((name) => ({ name, description: '' })),
    relationships: [],
    acts: acts.map((act) => ({
      id: act.id,
      actNumber: act.actNumber,
      title: act.title,
      sceneIds: act.sceneIds,
    })),
    meta: {
      source: 'upload',
      importedAt: new Date().toISOString(),
      parser: 'offline',
    },
  };

  return {
    scriptData: normalizeScriptData(raw),
    warnings: [...new Set(warnings)],
  };
}
