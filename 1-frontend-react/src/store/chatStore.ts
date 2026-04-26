import { create } from 'zustand';

export interface Message {
    sender: 'user' | 'bot';
    text: string;
    action?: string;
}

interface ChatState {
    messages: Message[];
    chatId: number | null;
    setChatId: (id: number) => void;
    addMessage: (msg: Message) => void;
    setMessages: (msgs: Message[]) => void;
    clearSession: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    chatId: null,
    setChatId: (id: number) => {
        // 1. Back it up to the browser memory
        localStorage.setItem('currentChatId', id.toString());
        
        // 2. Update React's live memory
        set({ chatId: id });
    },
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setMessages: (msgs) => set({ messages: msgs }),
    clearSession: () => {
        // 1. Wipe it from the browser memory
        localStorage.removeItem('currentChatId');
        
        // 2. Clear React's live memory and empty the screen
        set({ chatId: null, messages: [] });
    },
}));