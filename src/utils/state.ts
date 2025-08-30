import { create } from "zustand";
import { getConversation as dbGetConversation, getMessagesForConversation, createConversation as dbCreateConversation, deleteConversation } from "@/lib/database/methods";

export type ConversationState = {
    id: string;
    model_id: string,
    title: string,
    messages: ChatMessage[];
};

export type ChatMessage = {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_used?: number;
    created_at: string;
};


export type SidebarDataState = {
    conversations: Omit<ConversationState, 'messages'>[];
    addConversation: (conversation: Omit<ConversationState, 'messages'>) => void;
    addConversations: (conversations: Omit<ConversationState, 'messages'>[]) => void;
    removeConversation: (conversationId: string) => void;
    updateConversation: (conversation: Omit<ConversationState, 'messages'>) => void;
}

export type ChatConversationsState = {
    conversation: ConversationState | null;

    // Now requires a conversationId; implementation will fetch data from DB.
    setConversation: (conversationId: string | null) => Promise<void>;
    getConversation: () => ConversationState | null;
    // createConversation now persists to DB and returns a Promise<string> (the id)
    createConversation: (conversationId?: string, messages?: ChatMessage[], modelId?: string, title?: string) => Promise<string>;
    updateConversation: (patch: Partial<Omit<ConversationState, "conversationId">>) => void;
    removeConversation: () => void;

    addMessage: (message: ChatMessage) => void;
    updateMessage: (messageId: string, content: string) => void;
    removeMessage: (messageId: string) => void;
    setMessages: (messages: ChatMessage[]) => void;

    clearAll: () => void;
};


export type Model = {
    id: string;
    name: string;
    created: number;
    description: string;
    architecture: {
        input_modalities: string[];
        output_modalities: string[];
        tokenizer: string;
        instruct_type: string;
    };
    top_provider: {
        is_moderated: boolean;
        context_length: number;
        max_completion_tokens: number;
    };
    pricing: {
        prompt: string;
        completion: string;
        image: string;
        request: string;
        web_search: string;
        internal_reasoning: string;
        input_cache_read: string;
        input_cache_write: string;
    };
    canonical_slug: string;
    context_length: number;
    hugging_face_id: string;
    per_request_limits: Record<string, any>;
    supported_parameters: string[];
};

export const useStore = create<ChatConversationsState>((set, get) => ({
    conversation: null,

    setConversation: async (conversationId: string | null) => {
        if (!conversationId) {
            set(() => ({ conversation: null }));
            return;
        }

        try {
            const convoRows = await dbGetConversation(conversationId as string);
            const convoRow = Array.isArray(convoRows) ? convoRows[0] : convoRows;

            if (!convoRow) {
                set(() => ({ conversation: null }));
                return;
            }

            const messages = await getMessagesForConversation(conversationId as string);

            const conversationState: ConversationState = {
                id: convoRow.id,
                model_id: convoRow.model_id ?? "",
                title: convoRow.title ?? "",
                messages: Array.isArray(messages) ? messages : [],
            };

            set(() => ({ conversation: conversationState }));
        } catch (err) {
            console.error("setConversation error:", err);
            set(() => ({ conversation: null }));
        }
    },

    getConversation: () => get().conversation,

    createConversation: async (conversationId?: string, messages: ChatMessage[] = [], modelId?: string, title?: string) => {
        const id = conversationId || `conversation-${Date.now()}`;
        try {
            await dbCreateConversation(id, title, modelId);
            await get().setConversation(id);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("createConversation error:", err);
            // Still set a local ephemeral conversation if DB call fails.
            const convo: ConversationState = { id, model_id: modelId || "", title: title || "", messages };
            set(() => ({ conversation: convo }));
        }

        return id;
    },

    updateConversation: (patch: Partial<Omit<ConversationState, "id">>) =>
        set((state) => ({ conversation: state.conversation ? { ...state.conversation, ...patch } : state.conversation })),

    removeConversation: () => set(() => ({ conversation: null })),

    addMessage: (message: ChatMessage) =>
        set((state) => ({
            conversation: state.conversation
                ? { ...state.conversation, messages: [...(state.conversation.messages ?? []), message] }
                : state.conversation,
        })),

    updateMessage: (messageId: string, content: string) =>
        set((state) => ({
            conversation: state.conversation
                ? { ...state.conversation, messages: (state.conversation.messages ?? []).map((m) => (m.id === messageId ? { ...m, content } : m)) }
                : state.conversation,
        })),

    removeMessage: (messageId: string) =>
        set((state) => ({
            conversation: state.conversation
                ? { ...state.conversation, messages: (state.conversation.messages ?? []).filter((m) => m.id !== messageId) }
                : state.conversation,
        })),

    setMessages: (messages: ChatMessage[]) =>
        set((state) => ({ conversation: state.conversation ? { ...state.conversation, messages } : state.conversation })),

    clearAll: () => set(() => ({ conversation: null })),
}));

export const useSidebarConversation = create<SidebarDataState>((set) => ({
    conversations: [],

    addConversations(conversations) {
        set((state) => ({ conversations: [...state.conversations, ...conversations] }));
    },

    addConversation: (conversation) => set((state) => ({ conversations: [...state.conversations, conversation] })),

    removeConversation: async (conversationId) => {
        try {
            await deleteConversation(conversationId);
            set((state) => ({
                conversations: state.conversations.filter((c) => c.id !== conversationId)
            }));
        } catch (error) {
            console.error("Error removing conversation:", error);
        }
    },

    updateConversation: (conversation) => set((state) => ({
        conversations: state.conversations.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c))
    })),
}));
