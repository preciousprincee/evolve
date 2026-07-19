import { apiFetch } from '../services/apiClient.js';

export const memoryApi = {
  list: (category) => apiFetch(`/api/memories${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  create: (memory) => apiFetch('/api/memories', { method: 'POST', body: memory }),
  update: (id, updates) => apiFetch(`/api/memories/${id}`, { method: 'PATCH', body: updates }),
  remove: (id) => apiFetch(`/api/memories/${id}`, { method: 'DELETE' }),
};
