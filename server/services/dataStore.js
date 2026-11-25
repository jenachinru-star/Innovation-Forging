import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { migrateScriptDataIds, remapSceneReferences } from '@director/shared/migration/ids.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE = path.resolve(__dirname, '../data/store.json');

function emptyData() {
  return {
    users: Object.create(null),
    sessions: Object.create(null),
    projects: Object.create(null),
  };
}

/**
 * 一次性把项目内剧本层的旧临时 id 迁移为稳定 UUID，并同步 plan 场景引用。
 * 幂等：已是 UUID 的记录不重复生成。返回 { record, changed }。
 */
function migrateProjectIds(record) {
  if (!record || typeof record !== 'object') return { record, changed: false };
  let changed = false;
  const next = { ...record };

  if (record.scriptData && typeof record.scriptData === 'object') {
    const { data, maps } = migrateScriptDataIds(record.scriptData);
    next.scriptData = data;
    const hasLegacy =
      Object.keys(maps.scenes).length > 0 ||
      Object.keys(maps.characters).length > 0 ||
      Object.keys(maps.acts).length > 0;
    if (hasLegacy) changed = true;
    if (record.plan) next.plan = remapSceneReferences(record.plan, maps.scenes);
  }

  if (Array.isArray(record.scriptVersions)) {
    next.scriptVersions = record.scriptVersions.map((version) => {
      if (!version || !version.data) return version;
      const { data } = migrateScriptDataIds(version.data);
      return { ...version, data };
    });
  }

  return { record: next, changed };
}

export function createStore(filePath = DEFAULT_FILE) {
  const resolved = path.resolve(filePath);
  let data = emptyData();
  let loaded = false;
  let writeChain = Promise.resolve();

  async function load() {
    try {
      const raw = await readFile(resolved, 'utf8');
      const parsed = JSON.parse(raw);
      data = {
        users: parsed.users || Object.create(null),
        sessions: parsed.sessions || Object.create(null),
        projects: parsed.projects || Object.create(null),
      };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      data = emptyData();
    }

    // 加载时一次性迁移剧本层旧临时 id 为稳定 UUID，有变更则回写
    let migrated = false;
    for (const [id, record] of Object.entries(data.projects)) {
      const { record: next, changed } = migrateProjectIds(record);
      if (changed) {
        data.projects[id] = next;
        migrated = true;
      }
    }
    if (migrated) await persist();

    loaded = true;
  }

  // 串行化 + 原子写（临时文件 rename），避免并发写损坏
  function persist() {
    const snapshot = structuredClone(data);
    writeChain = writeChain.then(async () => {
      await mkdir(path.dirname(resolved), { recursive: true });
      const tmp = `${resolved}.tmp-${process.pid}-${randomUUID()}`;
      await writeFile(tmp, JSON.stringify(snapshot, null, 2), 'utf8');
      await rename(tmp, resolved);
    });
    return writeChain;
  }

  const store = {
    file: resolved,
    async init() {
      if (!loaded) await load();
      return store;
    },
    flush() {
      return writeChain;
    },

    getUser(username) {
      return data.users[username] || null;
    },
    putUser(user) {
      data.users[user.username] = user;
      persist();
      return user;
    },

    getSession(token) {
      return data.sessions[token] || null;
    },
    putSession(token, session) {
      data.sessions[token] = session;
      persist();
      return session;
    },
    deleteSession(token) {
      delete data.sessions[token];
      persist();
    },

    getProject(id) {
      return data.projects[id] || null;
    },
    putProject(id, record) {
      data.projects[id] = record;
      persist();
      return record;
    },
    deleteProject(id) {
      delete data.projects[id];
      persist();
    },
    listProjectsByUser(userId) {
      return Object.values(data.projects).filter((item) => item.userId === userId);
    },
  };

  return store;
}
