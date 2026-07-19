import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageBubble } from '../components/MessageBubble.jsx';
import { DateSeparator } from '../components/DateSeparator.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { useChatStore } from '../stores/chatStore.js';
import { useChat } from '../hooks/useChat.js';
import { chatApi } from '../api/chatApi.js';

const MAX_TEXTAREA_HEIGHT = 128; // px, matches max-h-32

export default function Chat() {
  const navigate = useNavigate();
  const { messages, isSending, error, setMessages } = useChatStore();
  const { sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

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

  // Auto-grow the textarea as the user types, instead of a fixed single row —
  // small detail, but it's what makes a text input feel considered rather
  // than bare-bones.
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  let lastDate = null;

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Sticky, blurred header so content fades under it on scroll instead
          of clipping abruptly against a hard edge. */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4 shrink-0 bg-void/70 backdrop-blur-glass border-b border-white/[0.06]">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] active:scale-90 transition-all -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <AuroraOrb size={36} />
        <div>
          <h1 className="font-display text-lg leading-none">Evolve</h1>
          <p className="text-xs text-ink-faint mt-0.5">{isSending ? 'thinking…' : 'here with you'}</p>
        </div>
      </header>

      {/* pb-48 clears the fixed input bar AND the fixed tab bar sitting below it */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-48 flex flex-col gap-2">
        {!isLoadingHistory && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-2"
          >
            <AuroraOrb size={64} />
            <p className="text-sm text-ink-muted mt-2">Say anything. I'm listening.</p>
          </motion.div>
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

      {/* Sits well above the fixed BottomNav (~76px tall including its own
          safe-area padding) rather than sharing its bottom:0 band — sharing
          that band is what hides this input behind the nav bar. */}
      <div className="fixed bottom-[76px] left-0 right-0 z-30 pointer-events-none">
        <div className="bg-gradient-to-t from-void via-void/90 to-transparent pt-6 pb-2 px-4 pointer-events-auto">
          <form onSubmit={handleSubmit}>
            <div className="glass-panel-solid flex items-end gap-2 p-2 rounded-2xl transition-colors duration-200 focus-within:border-aurora-violet/50 focus-within:shadow-glow">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
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
      </div>
    </div>
  );
}
