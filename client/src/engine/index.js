import { parseScriptOffline } from '@director/shared/parser/index.js';
import * as api from '../api.js';

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
      if (!scene || !Array.isArray(scene.characters)) return scene;
      return { ...scene, characters: scene.characters.map(rename) };
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

export async function parseScript(scriptText, { aliasMap } = {}) {
  try {
    const data = await api.parseScript(scriptText);
    if (isValidParseResult(data)) return data;
  } catch {
    // 远程不可用，回退本地解析
  }
  sourceMode = 'local';
  const { scriptData } = parseScriptOffline(scriptText);
  return { scriptData: applyAliasMap(scriptData, aliasMap) };
}

export async function extractUpload(file) {
  try {
    return await api.extractUpload(file);
  } catch {
    throw new Error('离线状态无法解析上传文件，请直接粘贴剧本内容或使用样例剧本。');
  }
}

export async function generateScript(material) {
  try {
    return await api.generateScript(material);
  } catch {
    throw new Error('离线状态无法生成剧本，请使用「导入剧本」或「使用样例剧本」。');
  }
}
