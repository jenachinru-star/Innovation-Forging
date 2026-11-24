import { parseScriptOffline } from '@director/shared/parser/index.js';
import * as api from '../api.js';
import { extractBrowserFile } from '../services/extractBrowser.js';

let sourceMode = 'ai';

export function getSourceMode() {
  return sourceMode;
}

export function parseOffline(text) {
  const { scriptData } = parseScriptOffline(text);
  return { scriptData };
}

function isValidParseResult(data) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      data.scriptData &&
      typeof data.scriptData === 'object'
  );
}

function applyAliasMap(scriptData, aliasMap) {
  if (!scriptData || !aliasMap || typeof aliasMap !== 'object') return scriptData;
  const rename = (name) =>
    Object.prototype.hasOwnProperty.call(aliasMap, name) ? aliasMap[name] : name;

  if (Array.isArray(scriptData.characters)) {
    scriptData.characters = scriptData.characters.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const next = rename(item.name);
      return next === item.name ? item : { ...item, name: next };
    });
  }

  if (Array.isArray(scriptData.scenes)) {
    scriptData.scenes = scriptData.scenes.map((scene) => {
      if (!scene || typeof scene !== 'object') return scene;
      const next = { ...scene };
      if (Array.isArray(scene.characters)) {
        next.characters = scene.characters.map(rename);
      }
      if (Array.isArray(scene.presentCharacters)) {
        const present = [];
        const seen = new Set();
        for (const name of scene.presentCharacters) {
          const renamed = rename(name);
          if (!seen.has(renamed)) {
            seen.add(renamed);
            present.push(renamed);
          }
        }
        next.presentCharacters = present;
      }
      return next;
    });
  }

  if (Array.isArray(scriptData.relationships)) {
    scriptData.relationships = scriptData.relationships.map((rel) => {
      if (!rel || typeof rel !== 'object') return rel;
      return { ...rel, from: rename(rel.from), to: rename(rel.to) };
    });
  }

  return scriptData;
}

export async function parseScript(scriptText, { aliasMap, allowRemote = true } = {}) {
  if (allowRemote) {
    try {
      const data = await api.parseScript(scriptText);
      if (isValidParseResult(data)) return data;
    } catch {
      // 远程不可用，回退本地解析
    }
  }
  sourceMode = 'local';
  const { scriptData } = parseScriptOffline(scriptText);
  return { scriptData: applyAliasMap(scriptData, aliasMap) };
}

export async function extractUpload(file) {
  try {
    return await api.extractUpload(file);
  } catch {
    const scriptText = await extractBrowserFile(file);
    sourceMode = 'local';
    return { scriptText };
  }
}

export async function generateScript(material) {
  try {
    return await api.generateScript(material);
  } catch {
    throw new Error('离线状态无法生成剧本，请使用「导入剧本」或「使用样例剧本」。');
  }
}
