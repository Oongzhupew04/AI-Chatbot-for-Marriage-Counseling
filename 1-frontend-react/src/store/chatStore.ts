import { create } from 'zustand';

export interface Message {
    sender: 'user' | 'bot';
    text: string;
    action?: string;
}

interface ChatState {
    messages: Message[];
    chatId: string | null;
    setChatId: (id: string) => void;
    addMessage: (msg: Message) => void;
    clearSession: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    chatId: null,
    setChatId: (id) => set({ chatId: id }),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    clearSession: () => set({ messages: [], chatId: null }),
}));