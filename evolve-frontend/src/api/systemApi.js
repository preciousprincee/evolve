import { apiFetch } from '../services/apiClient.js';

export const creditsApi = {
  getMe: () => apiFetch('/api/credits/me'),
};

export const notificationsApi = {
  list: () => apiFetch('/api/notifications'),
  markRead: (id) => apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
};
