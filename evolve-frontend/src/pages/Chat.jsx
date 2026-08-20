import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { MessageBubble } from '../components/MessageBubble.jsx';
import { DateSeparator } from '../components/DateSeparator.jsx';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { useChatStore } from '../stores/chatStore.js';
import { useChat } from '../hooks/useChat.js';
import { useProfileStore } from '../stores/profileStore.js';
import { fetchChatHistory } from '../api/chatApi.js';
import { useVoice } from '../hooks/useVoice.js';
import { opposingVoiceGender } from '../constants/relationship.js';

const AUTO_SPEAK_KEY = 'evolve-auto-speak';

export default function Chat() {
  const navigate = useNavigate();
  const { messages, isSending, error, setMessages } = useChatStore();
  const { sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [romantic, setRomantic] = useState(false);
  const [voiceGender, setVoiceGender] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem(AUTO_SPEAK_KEY) === 'true');
  const scrollRef = useRef(null);
  const lastSpokenIdRef = useRef(null);
  const {
    isListening,
    isSpeaking,
    speechRecognitionSupported,
    speechSynthesisSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  } = useVoice();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    // Only load history once per app session — if messages are already in
    // the store (e.g. navigated away and back without a full refresh),
    // don't clobber them with a re-fetch.
    if (messages.length > 0) {
      setHistoryLoaded(true);
      return;
    }
    fetchChatHistory({ limit: 50 })
      .then((res) => {
        setMessages(
          (res.messages || []).map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at }))
        );
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reflects the shared store's current value — Profile.jsx calls
    // store.refresh() after a toggle, so this naturally picks up changes
    // without a second independent fetch here.
    useProfileStore.getState().fetch().then((res) => {
      setRomantic(Boolean(res?.profile?.romantic_mode_enabled));
      setVoiceGender(opposingVoiceGender(res?.profile?.gender));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(AUTO_SPEAK_KEY, String(autoSpeak));
    if (!autoSpeak) cancelSpeech();
  }, [autoSpeak, cancelSpeech]);

  useEffect(() => {
    if (!autoSpeak || !speechSynthesisSupported) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.isStreaming) return;
    if (lastSpokenIdRef.current === last.id) return;
    lastSpokenIdRef.current = last.id;
    speak(last.content, { romantic, voiceGender });
  }, [messages, autoSpeak, speechSynthesisSupported, romantic, voiceGender, speak]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    cancelSpeech(); // don't talk over the next message going out
    sendMessage(input);
    setInput('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    cancelSpeech();
    startListening((transcript) => setInput(transcript));
  };

  let lastDate = null;

  return (
    <div className="flex flex-col h-screen pb-40">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <AuroraOrb size={36} romantic={romantic} />
        <div>
          <h1 className="font-display text-lg leading-none flex items-center gap-1.5">
            Evolve
            {romantic && (
              <span className="text-[10px] font-body font-medium text-aurora-rose bg-aurora-rose/10 border border-aurora-rose/30 rounded-full px-2 py-0.5">
                Romantic Mode
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-faint mt-0.5">{isSending ? 'thinking…' : 'here with you'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {speechRecognitionSupported && speechSynthesisSupported && (
            <button
              type="button"
              onClick={() => navigate('/call')}
              aria-label="Start a call"
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                romantic ? 'bg-aurora-rose/20 text-aurora-rose' : 'bg-aurora-violet/20 text-aurora-violet'
              }`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {speechSynthesisSupported && (
            <button
              type="button"
              onClick={() => setAutoSpeak((v) => !v)}
              aria-label={autoSpeak ? 'Turn off spoken replies' : 'Turn on spoken replies'}
              aria-pressed={autoSpeak}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                autoSpeak ? (romantic ? 'bg-aurora-rose/20 text-aurora-rose' : 'bg-aurora-violet/20 text-aurora-violet') : 'text-ink-faint'
              }`}
            >
              {autoSpeak ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
                  <path d="M18 6a9 9 0 0 1 0 12" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m17 9 4 6M21 9l-4 6" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
        {historyLoaded && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 opacity-70">
            <AuroraOrb size={64} romantic={romantic} />
            <p className="text-sm text-ink-muted mt-2">Say anything. I'm listening.</p>
          </div>
        )}

        {!historyLoaded && (
          <div className="flex-1 flex items-center justify-center">
            <AuroraOrb size={48} romantic={romantic} />
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
                <MessageBubble role={m.role} content={m.content} isStreaming={m.isStreaming} romantic={romantic} />
              </div>
            );
          })}
        </AnimatePresence>

        {error && <p className="text-xs text-aurora-rose text-center py-2">{error}</p>}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="fixed left-0 right-0 z-30 px-4 pt-2 bg-gradient-to-t from-void via-void/95 to-transparent" style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        <div className="glass-panel-solid flex items-end gap-2 p-2 rounded-2xl">
          {speechRecognitionSupported && (
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? 'Stop voice input' : 'Speak your message'}
              aria-pressed={isListening}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-aurora-rose text-void animate-pulse'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isListening ? 'Listening…' : 'Message Evolve…'}
            rows={1}
            maxLength={4000}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] py-2 px-2 max-h-32 placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center disabled:opacity-30 transition-transform active:scale-90 ${romantic ? 'bg-romantic-gradient' : 'bg-aurora-gradient'}`}
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
