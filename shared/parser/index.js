import { normalizeScriptData } from '../index.js';

const ACT_RE = /^第[一二三四五六七八九十百\d]+幕/;
const SCENE_RE = /^第[一二三四五六七八九十百\d]+场\s*(.*)$/;
const SCENE_NUM_RE = /^第([一二三四五六七八九十百\d]+)场/;
const CUE_RE = /^([^\s：:（）()【】]{1,12})[：:]\s*(.+)$/;
const DIR_RE = /^[（(【].*[）)】]$/;
const CAST_RE = /^(?:人物|角色)\s*[：:]\s*(.+)$/;

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

function splitNames(str) {
  return String(str || '')
    .split(/[、，,／/\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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

export function parseScriptOffline(text) {
  const warnings = [];
  const rawText = typeof text === 'string' ? text : '';
  const lines = splitLines(rawText);

  const headerCandidates = new Set();
  const allCharacterOrder = [];
  const allCharacterSet = new Set();
  const addCharacter = (name) => {
    if (name && !allCharacterSet.has(name)) {
      allCharacterSet.add(name);
      allCharacterOrder.push(name);
    }
  };

  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    const cast = t.match(CAST_RE);
    if (cast) {
      for (const name of splitNames(cast[1])) {
        headerCandidates.add(name);
        addCharacter(name);
      }
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

  const scanProps = (value) => {
    if (!currentScene) return;
    for (const prop of PROPS) {
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

    delete scene._speakers;
    delete scene._speakerSet;
    delete scene._propOrder;
    delete scene._propSet;
    delete scene._dialogueChars;

    if (currentAct) currentAct.sceneIds.push(scene.id);
    scenes.push(scene);
    currentScene = null;
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
      const title = t.slice(actMatch[0].length).trim();
      currentAct = { id: `act-${actNumber}`, actNumber, title, sceneIds: [] };
      acts.push(currentAct);
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
      const location = sceneMatch[1].trim();
      currentScene = {
        id: `sc-${sceneNumber}`,
        sceneNumber,
        title: t,
        location,
        characters: [],
        presentCharacters: [],
        props: [],
        stageDirections: [],
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
      continue;
    }

    if (CAST_RE.test(t)) continue;

    if (!currentScene) continue;

    if (DIR_RE.test(t)) {
      currentScene.stageDirections.push(t);
      scanProps(t);
      continue;
    }

    const cue = t.match(CUE_RE);
    if (cue) {
      const name = cue[1];
      const dialogue = cue[2].trim();
      if (!headerCandidates.has(name)) {
        warnings.push(`台词人物「${name}」不在候选表，已按台词处理`);
      }
      if (!currentScene._speakerSet.has(name)) {
        currentScene._speakerSet.add(name);
        currentScene._speakers.push(name);
      }
      currentScene._dialogueChars += dialogue.length;
      scanProps(dialogue);
      continue;
    }
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
