import { useCallback, useRef } from 'react';
import { useChatStore } from '../stores/chatStore.js';
import { streamChatMessage } from '../api/chatApi.js';
import { ApiError } from '../services/apiClient.js';

export function useChat() {
  const { appendUserMessage, beginAssistantMessage, appendToken, finishAssistantMessage, setSending, setError } =
    useChatStore();
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setError(null);
      appendUserMessage(trimmed);
      const assistantId = beginAssistantMessage();
      setSending(true);

      abortRef.current = new AbortController();

      try {
        await streamChatMessage(trimmed, {
          signal: abortRef.current.signal,
          onToken: (token) => appendToken(assistantId, token),
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
          setError(message);
          appendToken(assistantId, `\n\n_${message}_`);
        }
      } finally {
        finishAssistantMessage(assistantId);
        setSending(false);
      }
    },
    [appendUserMessage, beginAssistantMessage, appendToken, finishAssistantMessage, setSending, setError]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, cancelStream };
}
