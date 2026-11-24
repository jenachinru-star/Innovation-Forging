export const COOKIE_NAME = 'kaipai_session';
const SESSION_DAYS = 7;
export const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

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

export function writeSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Max-Age=${Math.floor(SESSION_MS / 1000)}; ${flags()}`
  );
}

export function removeSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; ${flags()}`);
}
