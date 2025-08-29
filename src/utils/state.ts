import type { ChatMessage } from "@/components/ChatMessages";
import { create } from "zustand";

export type ConversationState = {
    conversationId: string;
    modelId: string,
    title: string,
    messages: ChatMessage[];
};

export type ChatConversationsState = {
    conversation: ConversationState | null;

    setConversation: (conversation: ConversationState | null) => void;
    getConversation: () => ConversationState | null;
    createConversation: (conversationId?: string, messages?: ChatMessage[]) => string;
    updateConversation: (patch: Partial<Omit<ConversationState, "conversationId">>) => void;
    removeConversation: () => void;

    addMessage: (message: ChatMessage) => void;
    updateMessage: (messageId: string, content: string) => void;
    removeMessage: (messageId: string) => void;
    setMessages: (messages: ChatMessage[]) => void;

    clearAll: () => void;
};


export const useStore = create<ChatConversationsState>((set, get) => ({
    conversation: null,

    setConversation: (conversation: ConversationState | null) => set(() => ({ conversation })),

    getConversation: () => get().conversation,

    createConversation: (conversationId?: string, messages: ChatMessage[] = []) => {
        const id = conversationId || `conversation-${Date.now()}`;
        const convo: ConversationState = { conversationId: id, modelId: "", title: "", messages };
        set(() => ({ conversation: convo }));
        return id;
    },

    updateConversation: (patch: Partial<Omit<ConversationState, "conversationId">>) =>
        set((state) => ({ conversation: state.conversation ? { ...state.conversation, ...patch } : state.conversation })),

    removeConversation: () => set(() => ({ conversation: null })),

    addMessage: (message: ChatMessage) =>
        set((state) => ({
            conversation: state.conversation ? { ...state.conversation, messages: [...state.conversation.messages, message] } : state.conversation,
        })),

    updateMessage: (messageId: string, content: string) =>
        set((state) => ({
            conversation: state.conversation
                ? { ...state.conversation, messages: state.conversation.messages.map((m) => (m.id === messageId ? { ...m, content } : m)) }
                : state.conversation,
        })),

    removeMessage: (messageId: string) =>
        set((state) => ({
            conversation: state.conversation ? { ...state.conversation, messages: state.conversation.messages.filter((m) => m.id !== messageId) } : state.conversation,
        })),

    setMessages: (messages: ChatMessage[]) =>
        set((state) => ({ conversation: state.conversation ? { ...state.conversation, messages } : state.conversation })),

    clearAll: () => set(() => ({ conversation: null })),
}));

export default useStore;

