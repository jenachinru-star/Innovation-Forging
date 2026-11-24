export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(url, options = {}) {
  const hasBody = options.body !== undefined;
  const res = await fetch(url, {
    credentials: 'same-origin', // 自动携带 httpOnly 会话 cookie
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `请求失败（${res.status}）`);
  }
  return data;
}
