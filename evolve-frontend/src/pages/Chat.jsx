import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageBubble } from '../components/MessageBubble.jsx';
import { DateSeparator } from '../components/DateSeparator.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { useChatStore } from '../stores/chatStore.js';
import { useChat } from '../hooks/useChat.js';
import { chatApi } from '../api/chatApi.js';

export default function Chat() {
  const { messages, isSending, error, setMessages } = useChatStore();
  const { sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Only fetch from the server if the store is empty — this covers the
    // "just refreshed the page" case without re-fetching (and duplicating)
    // when the user simply navigates away from Chat and back within the
    // same session, since messages already live in the in-memory store then.
    if (messages.length > 0) {
      setIsLoadingHistory(false);
      return;
    }

    chatApi
      .getHistory()
      .then(({ messages: history }) => {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.created_at,
          }))
        );
      })
      .catch(() => {
        // Non-fatal — chat still works for new messages even if history fails to load.
      })
      .finally(() => setIsLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    sendMessage(input);
    setInput('');
  };

  let lastDate = null;

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <AuroraOrb size={36} />
        <div>
          <h1 className="font-display text-lg leading-none">Evolve</h1>
          <p className="text-xs text-ink-faint mt-0.5">{isSending ? 'thinking…' : 'here with you'}</p>
        </div>
      </header>

      {/* pb-40 clears BOTH the fixed input bar and the fixed tab bar below it */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 flex flex-col gap-2">
        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 opacity-70">
            <AuroraOrb size={64} />
            <p className="text-sm text-ink-muted mt-2">Say anything. I'm listening.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const dateKey = new Date(m.createdAt).toDateString();
            const showSeparator = dateKey !== lastDate;
            lastDate = dateKey;
            return (
              <div key={m.id}>
                {showSeparator && <DateSeparator date={m.createdAt} />}
                <MessageBubble role={m.role} content={m.content} isStreaming={m.isStreaming} />
              </div>
            );
          })}
        </AnimatePresence>

        {error && <p className="text-xs text-aurora-rose text-center py-2">{error}</p>}
        <div ref={scrollRef} />
      </div>

      {/* Sits ABOVE the fixed BottomNav (which occupies roughly the bottom 76px,
          including its own safe-area padding) rather than sharing the same
          bottom:0 band — that overlap was hiding this input behind the nav bar. */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-[76px] left-0 right-0 z-30 px-4 pt-2 bg-gradient-to-t from-void via-void/95 to-transparent"
      >
        <div className="glass-panel-solid flex items-end gap-2 p-2 rounded-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Message Evolve…"
            rows={1}
            maxLength={4000}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] py-2 px-2 max-h-32 placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="w-10 h-10 shrink-0 rounded-full bg-aurora-gradient flex items-center justify-center disabled:opacity-30 transition-transform active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0E14" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
