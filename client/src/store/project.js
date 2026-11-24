export const DB_NAME = 'director-workbench';
export const STORE_NAME = 'projects';
export const KEY = 'current';
export const PROJECT_KEY_PREFIX = 'project:';

const memory = new Map();

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined' && Boolean(indexedDB);
}

function openDb() {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, 1);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction(mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let result;
        try {
          const request = action(store);
          if (request) {
            request.onsuccess = () => {
              result = request.result;
            };
          }
        } catch (error) {
          reject(error);
          return;
        }
        tx.oncomplete = () => {
          db.close?.();
          resolve(result);
        };
        tx.onerror = () => {
          db.close?.();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close?.();
          reject(tx.error);
        };
      })
  );
}

export function isPersistent() {
  return hasIndexedDB();
}

export async function saveProject(state) {
  memory.set(KEY, state);
  if (!hasIndexedDB()) return state;
  await runTransaction('readwrite', (store) => store.put(state, KEY));
  return state;
}

export async function loadProject() {
  if (!hasIndexedDB()) {
    return memory.has(KEY) ? memory.get(KEY) : null;
  }
  const saved = await runTransaction('readonly', (store) => store.get(KEY));
  return saved === undefined ? null : saved;
}

export async function clearProject() {
  memory.delete(KEY);
  if (!hasIndexedDB()) return;
  await runTransaction('readwrite', (store) => store.delete(KEY));
}

export async function saveProjectRecord(record) {
  if (!record?.id) throw new Error('缺少作品 ID');
  const key = `${PROJECT_KEY_PREFIX}${record.id}`;
  memory.set(key, record);
  if (!hasIndexedDB()) return record;
  await runTransaction('readwrite', (store) => store.put(record, key));
  return record;
}

export async function loadProjectRecord(projectId) {
  if (!projectId) return null;
  const key = `${PROJECT_KEY_PREFIX}${projectId}`;
  if (!hasIndexedDB()) {
    return memory.has(key) ? memory.get(key) : null;
  }
  const saved = await runTransaction('readonly', (store) => store.get(key));
  return saved === undefined ? null : saved;
}

export async function listProjectRecords() {
  if (!hasIndexedDB()) {
    return [...memory.entries()]
      .filter(([key]) => key.startsWith(PROJECT_KEY_PREFIX))
      .map(([, value]) => value);
  }

  const records = await runTransaction('readonly', (store) => {
    if (typeof store.getAll === 'function') return store.getAll();
    return store.openCursor();
  });
  if (Array.isArray(records)) {
    return records.filter((item) => item && item.id);
  }
  return [];
}

export async function deleteProjectRecord(projectId) {
  if (!projectId) return;
  const key = `${PROJECT_KEY_PREFIX}${projectId}`;
  memory.delete(key);
  if (!hasIndexedDB()) return;
  await runTransaction('readwrite', (store) => store.delete(key));
}
