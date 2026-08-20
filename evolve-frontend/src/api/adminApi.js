import { apiFetch } from '../services/apiClient.js';

export const adminApi = {
  listUsers: ({ page = 1, pageSize = 25, search = '' } = {}) => {
    const params = new URLSearchParams({ page, pageSize, ...(search ? { search } : {}) });
    return apiFetch(`/api/admin/users?${params.toString()}`);
  },
  getUser: (userId) => apiFetch(`/api/admin/users/${userId}`),
};
