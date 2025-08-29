import type { ChatMessage } from "@/components/ChatMessages";
import { create } from "zustand";

export type ConversationState = {
    conversationId: string;
    modelId: string,
    title: string,
    messages: ChatMessage[];
};

export type ChatConversationsState = {
    conversations: ConversationState[];

    setConversations: (conversations: ConversationState[]) => void;
    getConversation: (conversationId: string) => ConversationState | undefined;
    addConversation: (conversationId?: string, messages?: ChatMessage[]) => string;
    addConversationObject: (conversation: ConversationState) => void;
    updateConversation: (conversationId: string, patch: Partial<Omit<ConversationState, "conversationId">>) => void;
    removeConversation: (conversationId: string) => void;

    /* message ops scoped to a conversation */
    addMessageToConversation: (conversationId: string, message: ChatMessage) => void;
    updateMessageInConversation: (conversationId: string, messageId: string, content: string) => void;
    removeMessageFromConversation: (conversationId: string, messageId: string) => void;
    setMessagesForConversation: (conversationId: string, messages: ChatMessage[]) => void;

    clearAll: () => void;
};


export const useStore = create<ChatConversationsState>((set, get) => ({
    conversations: [],

    setConversations: (conversations: ConversationState[]) => set(() => ({ conversations })),

    getConversation: (conversationId: string) => get().conversations.find((c) => c.conversationId === conversationId),

    addConversation: (conversationId?: string, messages: ChatMessage[] = []) => {
        const id = conversationId || `conversation-${Date.now()}`;
        set((state) => ({
            conversations: [...state.conversations, { conversationId: id, modelId: "", title: "", messages }],
        }));
        return id;
    },

    addConversationObject: (conversation: ConversationState) =>
        set((state) => ({ conversations: [...state.conversations, conversation] })),

    updateConversation: (conversationId: string, patch: Partial<Omit<ConversationState, "conversationId">>) =>
        set((state) => ({
            conversations: state.conversations.map((c) => (c.conversationId === conversationId ? { ...c, ...patch } : c)),
        })),

    removeConversation: (conversationId: string) =>
        set((state) => ({ conversations: state.conversations.filter((c) => c.conversationId !== conversationId) })),

    addMessageToConversation: (conversationId: string, message: ChatMessage) =>
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.conversationId === conversationId ? { ...c, messages: [...c.messages, message] } : c
            ),
        })),

    updateMessageInConversation: (conversationId: string, messageId: string, content: string) =>
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.conversationId === conversationId
                    ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, content } : m)) }
                    : c
            ),
        })),

    removeMessageFromConversation: (conversationId: string, messageId: string) =>
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.conversationId === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c
            ),
        })),

    setMessagesForConversation: (conversationId: string, messages: ChatMessage[]) =>
        set((state) => ({
            conversations: state.conversations.map((c) => (c.conversationId === conversationId ? { ...c, messages } : c)),
        })),

    clearAll: () => set(() => ({ conversations: [] })),
}));

export default useStore;

