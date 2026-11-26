import { apiRequest } from './client.js';

// 返回当前登录用户对象，未登录为 null
export async function currentUser() {
  const data = await apiRequest('/api/auth/session');
  return data.user;
}

export function register(username, password, remember) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember }),
  });
}

export function login(username, password, remember) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember }),
  });
}

export function logout() {
  return apiRequest('/api/auth/logout', { method: 'POST' });
}
