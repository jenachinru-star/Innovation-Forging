import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { createStore } from '../services/dataStore.js';

describe('dataStore', () => {
  const file = path.join(tmpdir(), `kaipai-${process.pid}-${Date.now()}.json`);
  let store;

  beforeEach(async () => {
    store = createStore(file);
    await store.init();
  });

  afterEach(async () => {
    await store.flush();
    await rm(file, { force: true });
  });

  it('用户存取', () => {
    expect(store.getUser('a')).toBeNull();
    store.putUser({ username: 'a', passwordHash: 'h' });
    expect(store.getUser('a').username).toBe('a');
  });

  it('会话写入、读取与删除', () => {
    expect(store.getSession('t1')).toBeNull();
    store.putSession('t1', { username: 'a' });
    expect(store.getSession('t1').username).toBe('a');
    store.deleteSession('t1');
    expect(store.getSession('t1')).toBeNull();
  });

  it('作品按用户隔离枚举与删除', () => {
    store.putProject('p1', { id: 'p1', userId: 'a' });
    store.putProject('p2', { id: 'p2', userId: 'b' });
    expect(store.getProject('p1').userId).toBe('a');
    expect(store.listProjectsByUser('a').map((p) => p.id)).toEqual(['p1']);
    store.deleteProject('p2');
    expect(store.getProject('p2')).toBeNull();
  });

  it('持久化后重新打开数据仍在', async () => {
    store.putUser({ username: 'persist', passwordHash: 'x' });
    store.putProject('p9', { id: 'p9', userId: 'persist' });
    await store.flush();

    const reopened = createStore(file);
    await reopened.init();
    expect(reopened.getUser('persist').username).toBe('persist');
    expect(reopened.listProjectsByUser('persist').map((p) => p.id)).toEqual(['p9']);
  });
});
