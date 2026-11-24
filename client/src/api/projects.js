import { apiRequest } from './client.js';

export function listProjects() {
  return apiRequest('/api/projects').then((data) => data.projects);
}

export function getProject(id) {
  return apiRequest(`/api/projects/${encodeURIComponent(id)}`).then((data) => data.project);
}

export function saveProject(id, record) {
  return apiRequest(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  }).then((data) => data.project);
}

export function removeProject(id) {
  return apiRequest(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
