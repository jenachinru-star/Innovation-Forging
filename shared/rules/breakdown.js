function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toText(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

export function enrichBreakdown(scriptData) {
  const data = scriptData && typeof scriptData === 'object' ? scriptData : {};
  const characters = asArray(data.characters);

  const scenes = asArray(data.scenes).map((rawScene) => {
    const scene = rawScene && typeof rawScene === 'object' ? rawScene : {};

    const presentCharacters = [];
    const presentSet = new Set();
    for (const name of asArray(scene.presentCharacters)) {
      if (name && !presentSet.has(name)) {
        presentSet.add(name);
        presentCharacters.push(name);
      }
    }

    const directions = asArray(scene.stageDirections).map(toText);
    for (const direction of directions) {
      if (!direction) continue;
      for (const character of characters) {
        const name = character && toText(character.name);
        if (!name || presentSet.has(name)) continue;
        const keys = [name, ...asArray(character.aliases)];
        if (keys.some((key) => typeof key === 'string' && key && direction.includes(key))) {
          presentSet.add(name);
          presentCharacters.push(name);
        }
      }
    }

    return { ...scene, presentCharacters };
  });

  return { ...data, scenes };
}
