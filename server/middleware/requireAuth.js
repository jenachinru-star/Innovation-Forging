import { readSessionToken, removeSessionCookie } from '../services/cookie.js';

export function isValidSession(session) {
  return Boolean(
    session &&
      typeof session.username === 'string' &&
      session.username &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt >= Date.now()
  );
}

export function createRequireAuth(store) {
  return function requireAuth(req, res, next) {
    const token = readSessionToken(req);
    if (!token) return res.status(401).json({ error: '请先登录' });

    const session = store.getSession(token);
    if (!isValidSession(session)) {
      store.deleteSession(token);
      removeSessionCookie(res);
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }

    req.user = { username: session.username };
    req.sessionToken = token;
    return next();
  };
}
