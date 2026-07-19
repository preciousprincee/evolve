import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { MessageBubble } from '../components/MessageBubble.jsx';
import { DateSeparator } from '../components/DateSeparator.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { useChatStore } from '../stores/chatStore.js';
import { useChat } from '../hooks/useChat.js';

export default function Chat() {
  const navigate = useNavigate();

  const { messages, isSending, error } = useChatStore();
  const { sendMessage } = useChat();

  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    });
  }, [messages, isSending]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!input.trim() || isSending) return;

    sendMessage(input);
    setInput('');
  };

  let lastDate = null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div>
            <h1 className="text-lg font-semibold">Evolve</h1>
            <p className="text-xs text-ink-muted">
              {isSending ? 'thinking…' : 'here with you'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 opacity-70">
            <AuroraOrb size={64} />
            <p className="text-sm text-ink-muted mt-2">
              Say anything. I'm listening.
            </p>
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
                <MessageBubble
                  role={m.role}
                  content={m.content}
                  isStreaming={m.isStreaming}
                />
              </div>
            );
          })}
        </AnimatePresence>

        {error && (
          <p className="text-xs text-aurora-rose text-center py-2">
            {error}
          </p>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 z-30 px-4 bg-gradient-to-t from-void via-void/95 to-transparent"
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0E14"
              strokeWidth="2.2"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}