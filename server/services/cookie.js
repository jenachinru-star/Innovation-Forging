export const COOKIE_NAME = 'kaipai_session';
const SHORT_SESSION_DAYS = 1;
const REMEMBER_SESSION_DAYS = 30;
export const SHORT_SESSION_MS = SHORT_SESSION_DAYS * 24 * 60 * 60 * 1000;
export const REMEMBER_SESSION_MS = REMEMBER_SESSION_DAYS * 24 * 60 * 60 * 1000;
// 默认（未勾选“记住我”）使用短效会话
export const SESSION_MS = SHORT_SESSION_MS;

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    }
  }
  return out;
}

export function readSessionToken(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME] || null;
}

function flags() {
  // 本地 http 不能带 Secure，否则浏览器不会回传 cookie
  const secure = process.env.NODE_ENV === 'production';
  return `HttpOnly; SameSite=Lax; Path=/${secure ? '; Secure' : ''}`;
}

export function writeSessionCookie(res, token, ttlMs = SESSION_MS) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Max-Age=${Math.floor(ttlMs / 1000)}; ${flags()}`
  );
}

export function removeSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; ${flags()}`);
}
