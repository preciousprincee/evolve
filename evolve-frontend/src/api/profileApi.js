import { apiFetch } from '../services/apiClient.js';

export const profileApi = {
  getMe: () => apiFetch('/api/profile/me'),
  updateMe: (updates) => apiFetch('/api/profile/me', { method: 'PATCH', body: updates }),
};
