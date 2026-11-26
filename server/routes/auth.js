import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '../services/password.js';
import {
  writeSessionCookie,
  removeSessionCookie,
  readSessionToken,
  REMEMBER_SESSION_MS,
  SHORT_SESSION_MS,
} from '../services/cookie.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/auth.js';

// 登录限流：同一 IP + 用户名，窗口内连续失败达到阈值后锁定
const FAIL_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000;
const failTracker = new Map();

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function trackerKey(req, username) {
  return `${clientIp(req)}|${username}`;
}

function isLocked(key) {
  const rec = failTracker.get(key);
  return Boolean(rec?.lockedUntil && rec.lockedUntil > Date.now());
}

function recordFailure(key) {
  const now = Date.now();
  const rec = failTracker.get(key) || { fails: 0, firstAt: now, lockedUntil: 0 };
  if (now - rec.firstAt > FAIL_WINDOW_MS) {
    rec.fails = 0;
    rec.firstAt = now;
    rec.lockedUntil = 0;
  }
  rec.fails += 1;
  if (rec.fails >= MAX_FAILS) rec.lockedUntil = now + LOCK_MS;
  failTracker.set(key, rec);
}

function clearFailures(key) {
  failTracker.delete(key);
}

function issueSession(store, res, username, remember) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const ttlMs = remember ? REMEMBER_SESSION_MS : SHORT_SESSION_MS;
  store.putSession(token, { username, createdAt: now, expiresAt: now + ttlMs });
  writeSessionCookie(res, token, ttlMs);
}

export function createAuthRouter(deps = {}) {
  const store = deps.store;
  const router = Router();

  router.post('/register', validate(registerSchema), (req, res) => {
    const { username, password, remember } = req.body;
    if (store.getUser(username)) return res.status(409).json({ error: '该用户名已被注册' });

    store.putUser({
      username,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    });
    issueSession(store, res, username, Boolean(remember));
    return res.status(201).json({ user: { username } });
  });

  router.post('/login', validate(loginSchema), (req, res) => {
    const { username, password, remember } = req.body;
    const key = trackerKey(req, username);
    if (isLocked(key)) {
      return res.status(429).json({ error: '失败次数过多，请稍后再试' });
    }

    const user = store.getUser(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordFailure(key);
      return res.status(401).json({ error: '用户名或密码不正确' });
    }

    clearFailures(key);
    issueSession(store, res, username, Boolean(remember));
    return res.json({ user: { username } });
  });

  router.get('/session', (req, res) => {
    const token = readSessionToken(req);
    if (!token) return res.json({ user: null });
    const session = store.getSession(token);
    if (!session || session.expiresAt < Date.now()) {
      store.deleteSession(token);
      removeSessionCookie(res);
      return res.json({ user: null });
    }
    return res.json({ user: { username: session.username } });
  });

  router.post('/logout', (req, res) => {
    const token = readSessionToken(req);
    if (token) store.deleteSession(token);
    removeSessionCookie(res);
    return res.json({ ok: true });
  });

  return router;
}
