import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  messages: [], // { id, role, content, createdAt, isStreaming? }
  isSending: false,
  error: null,

  setMessages: (messages) => set({ messages }),

  appendUserMessage: (content) => {
    const msg = { id: crypto.randomUUID(), role: 'user', content, createdAt: new Date().toISOString() };
    set((state) => ({ messages: [...state.messages, msg] }));
    return msg;
  },

  beginAssistantMessage: () => {
    const id = crypto.randomUUID();
    const msg = { id, role: 'assistant', content: '', createdAt: new Date().toISOString(), isStreaming: true };
    set((state) => ({ messages: [...state.messages, msg] }));
    return id;
  },

  appendToken: (id, token) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content: m.content + token } : m)),
    }));
  },

  finishAssistantMessage: (id) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)),
    }));
  },

  setSending: (isSending) => set({ isSending }),
  setError: (error) => set({ error }),
}));
