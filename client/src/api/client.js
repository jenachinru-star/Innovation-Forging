export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const NETWORK_ERROR = '网络异常或服务不可用，请稍后再试';

export async function apiRequest(url, options = {}) {
  const hasBody = options.body !== undefined;
  let res;
  try {
    res = await fetch(url, {
      credentials: 'same-origin', // 自动携带 httpOnly 会话 cookie
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    // 断网 / 无法连接：统一转友好中文错误，不暴露浏览器原生报错
    throw new ApiError(0, NETWORK_ERROR);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  // API 应返回 JSON；若拿到 HTML 等非 JSON（如静态托管把未知路由回退到页面），
  // 说明后端接口不可用，抛出友好错误，而不是把 null 当成功
  if (!isJson) {
    throw new ApiError(res.status, NETWORK_ERROR);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `请求失败（${res.status}）`);
  }
  return data;
}
