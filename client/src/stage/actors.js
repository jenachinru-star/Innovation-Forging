// 角色/场景/台词的派生纯函数，不依赖 React，供 StageBlocking 与画布组件共用。

export function normalizeCharacters(characters) {
  const list = Array.isArray(characters) ? characters : [];
  return list
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return { id: `ch-${item}`, name: item };
      const name = item.name || item.id || '';
      if (!name) return null;
      return { id: item.id || `ch-${name}`, name };
    })
    .filter(Boolean);
}

export function getScene(scenes, sceneNumber) {
  const list = Array.isArray(scenes) ? scenes : [];
  if (list.length === 0) return null;
  return list.find((scene) => Number(scene?.sceneNumber) === Number(sceneNumber)) || list[0];
}

export function hasScene(scenes, sceneNumber) {
  const list = Array.isArray(scenes) ? scenes : [];
  return list.some((scene) => Number(scene?.sceneNumber) === Number(sceneNumber));
}

export function sceneLines(scenes, sceneNumber) {
  const scene = getScene(scenes, sceneNumber);
  const raw = scene?.lines ?? scene?.dialogue ?? scene?.quotes ?? [];
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const lines = [];
  for (const item of list) {
    const speaker = typeof item === 'object' && item ? String(item.speaker ?? '').trim() : '';
    const text = String(
      typeof item === 'string' ? item : (item?.text ?? item?.quote ?? item?.content ?? '')
    ).trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    lines.push({ speaker, text });
  }
  return lines;
}

export function actorsFor(characters, cast) {
  const base = normalizeCharacters(characters);
  const castMap = cast && typeof cast === 'object' && !Array.isArray(cast) ? cast : {};
  const actors = [];

  for (const character of base) {
    const players = Array.isArray(castMap[character.name]) ? castMap[character.name] : [];
    if (players.length > 1) {
      players.forEach((player, index) => {
        const suffix = String.fromCharCode(65 + index);
        const characterId = `${character.name}#${suffix}`;
        actors.push({ characterId, label: `${character.name}（${suffix}）` });
      });
    } else {
      actors.push({ characterId: character.name, label: character.name });
    }
  }

  return actors;
}
