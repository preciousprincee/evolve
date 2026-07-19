import { supabase } from './supabaseClient.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'You need to be signed in.');
  return `Bearer ${token}`;
}

/**
 * Thin fetch wrapper for the backend API. Always attaches a fresh JWT (via
 * getSession, which auto-refreshes) — never a cached/stale token. Throws
 * ApiError with the backend's safe error message on failure, so callers can
 * show it directly to the user without leaking internals (the backend
 * already ensures the message is safe).
 */
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Authorization: await getAuthHeader() };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    let payload;
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    throw new ApiError(res.status, payload?.error?.code || 'UNKNOWN', payload?.error?.message || 'Something went wrong.');
  }

  return res.json();
}

export { ApiError, BACKEND_URL, getAuthHeader };
