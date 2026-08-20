import { useCallback, useRef } from 'react';
import { useChatStore } from '../stores/chatStore.js';
import { streamChatMessage } from '../api/chatApi.js';
import { ApiError } from '../services/apiClient.js';

export function useChat() {
  const { appendUserMessage, beginAssistantMessage, appendToken, finishAssistantMessage, setSending, setError } =
    useChatStore();
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    // onComplete(fullText) fires once the reply has fully streamed in —
    // used by Call mode, which needs the complete sentence before it can
    // speak it aloud (speech synthesis can't meaningfully read a reply
    // token-by-token the way the chat bubble can display it).
    async (text, { onComplete } = {}) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setError(null);
      appendUserMessage(trimmed);
      const assistantId = beginAssistantMessage();
      setSending(true);

      abortRef.current = new AbortController();
      let fullText = '';

      try {
        fullText = await streamChatMessage(trimmed, {
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
        onComplete?.(fullText);
      }
    },
    [appendUserMessage, beginAssistantMessage, appendToken, finishAssistantMessage, setSending, setError]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, cancelStream };
}
