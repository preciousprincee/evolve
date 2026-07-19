import { BACKEND_URL, getAuthHeader, ApiError } from '../services/apiClient.js';

/**
 * Streams a chat response. We use fetch + a manual SSE line parser rather
 * than the EventSource API, because EventSource only supports GET requests
 * and can't attach an Authorization header — and we need both (POST body
 * for the message, Bearer token for auth).
 *
 * onToken(text) fires per streamed chunk; resolves with the full reply.
 */
export async function streamChatMessage(message, { onToken, signal } = {}) {
  const res = await fetch(`${BACKEND_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await getAuthHeader(),
    },
    body: JSON.stringify({ message }),
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

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop(); // last (possibly incomplete) chunk stays buffered

    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();

      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.error) {
          throw new ApiError(500, 'STREAM_ERROR', parsed.error);
        }
        if (parsed.token) {
          fullText += parsed.token;
          onToken?.(parsed.token);
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        // Ignore malformed partial JSON — shouldn't happen given our SSE framing.
      }
    }
  }

  return fullText;
}
