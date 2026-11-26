import { uid } from '../id.js';

const SHOT_TYPES = ['远景', '全景', '中景', '近景', '特写'];
const CONFLICT_TYPES = [
  { id: 'interpersonal', label: '人际冲突' },
  { id: 'inner', label: '内心冲突' },
  { id: 'environment', label: '环境冲突' },
];
const CONFLICT_STATUS = [
  { id: 'open', label: '僵持' },
  { id: 'escalated', label: '升级' },
  { id: 'resolved', label: '化解' },
];

function scenesOf(scriptData) {
  return Array.isArray(scriptData?.scenes) ? scriptData.scenes : [];
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateString(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

// ---------- 1. 分镜故事板 ----------
export function buildShots(scriptData) {
  const shots = [];
  for (const scene of scenesOf(scriptData)) {
    const firstLine = (scene.lines || []).find((l) => l?.text);
    shots.push({
      id: uid(),
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      shotNumber: 1,
      shotType: '中景',
      title: scene.title || `第 ${scene.sceneNumber} 场`,
      description: scene.summary || (scene.stageDirections || [])[0] || '',
      dialogue: firstLine?.text || '',
      assetId: '',
      durationSec: Number.isFinite(Number(scene.estimatedMinutes))
        ? Math.round(Number(scene.estimatedMinutes) * 60)
        : 0,
    });
  }
  return shots;
}

// ---------- 2. 角色弧光 ----------
function scenesForCharacter(scriptData, name) {
  return scenesOf(scriptData).filter((scene) => {
    const inList = (scene.presentCharacters || scene.characters || []).includes(name);
    const speaks = (scene.lines || []).some((l) => l?.speaker === name);
    return inList || speaks;
  });
}

export function buildCharacterArcs(scriptData) {
  const characters = Array.isArray(scriptData?.characters) ? scriptData.characters : [];
  return characters.map((character) => {
    const relevant = scenesForCharacter(scriptData, character.name);
    const beats = relevant.map((scene) => {
      const spoken = (scene.lines || []).filter((l) => l?.speaker === character.name);
      const intensity = Math.min(95, 40 + spoken.length * 12);
      return {
        id: uid(),
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        state: '',
        intensity,
        note: '',
        quote: spoken[0]?.text || '',
      };
    });
    return { id: uid(), characterName: character.name, beats };
  });
}

// ---------- 3. 矛盾冲突 ----------
export function buildConflicts(scriptData) {
  const relationships = Array.isArray(scriptData?.relationships)
    ? scriptData.relationships
    : [];
  return relationships.map((rel) => ({
    id: uid(),
    type: 'interpersonal',
    parties: [rel.from, rel.to].filter(Boolean),
    sceneId: '',
    sceneNumber: null,
    title: `${rel.from} 与 ${rel.to}`,
    description: rel.relation || '',
    intensity: 3,
    status: 'open',
  }));
}

// ---------- 4. 排练日历矩阵（周一开头，6 行 × 7 列） ----------
export function buildCalendarMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7; // 周一为 0
  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const day = i - offset + 1;
    if (day >= 1 && day <= daysInMonth) {
      cells.push({
        day,
        date: toDateString(year, month, day),
        inMonth: true,
      });
    } else {
      cells.push({ day: '', date: '', inMonth: false });
    }
  }
  return cells;
}

// ---------- 5. 通告单 ----------
export function buildCallSheet(scriptData, sceneNumber, overrides = {}) {
  const scene = scenesOf(scriptData).find(
    (s) => Number(s.sceneNumber) === Number(sceneNumber)
  );
  if (!scene) return null;
  return {
    sceneNumber: scene.sceneNumber,
    title: scene.title || '',
    location: scene.location || '',
    characters: scene.presentCharacters?.length
      ? scene.presentCharacters
      : scene.characters || [],
    props: scene.props || [],
    stageDirections: scene.stageDirections || [],
    estimatedMinutes: scene.estimatedMinutes || 0,
    call: {
      callTime: overrides.callTime || '',
      assembly: overrides.assembly || '',
      contact: overrides.contact || '',
      notes: overrides.notes || '',
    },
  };
}

export { SHOT_TYPES, CONFLICT_TYPES, CONFLICT_STATUS };
