import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiRequest, ApiError } from './client.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('正常返回 JSON 数据', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ user: { username: 'a' } })));
    const data = await apiRequest('/api/auth/session');
    expect(data.user.username).toBe('a');
  });

  it('非 JSON 响应（静态回退 HTML）抛友好中文错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('<!doctype html><html></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          })
      )
    );
    await expect(apiRequest('/api/auth/login')).rejects.toMatchObject({
      name: 'ApiError',
      message: '网络异常或服务不可用，请稍后再试',
    });
  });

  it('非 2xx JSON 抛 ApiError 并带服务端 error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: '用户名或密码不正确' }, 401)));
    await expect(apiRequest('/api/auth/login')).rejects.toMatchObject({
      status: 401,
      message: '用户名或密码不正确',
    });
  });

  it('断网（fetch reject）时转友好错误', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const err = await apiRequest('/api/projects').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('网络异常或服务不可用，请稍后再试');
  });
});
