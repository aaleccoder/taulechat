import { db } from "./connection";

// ------------------------- Interfaces -------------------------

export interface AiModel {
    id: number;
    name: string;
    provider: string;
    description?: string;
    created_at: string;
}

export interface Conversation {
    id: string; // changed to string (UUID)
    model_id?: number;
    title?: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string; // changed to string (UUID)
    conversation_id: string; // changed to string (UUID)
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_used?: number;
    created_at: string;
}

// ------------------------- AI Models CRUD -------------------------

export function createAiModel(name: string, provider: string, description?: string) {
    return db.execute("INSERT INTO ai_models (name, provider, description) VALUES ($1, $2, $3)", [name, provider, description]);
}

export function getAiModel(id: number) {
    return db.select<AiModel[]>("SELECT * FROM ai_models WHERE id = $1", [id]);
}

export function getAllAiModels() {
    return db.select<AiModel[]>("SELECT * FROM ai_models");
}

export function updateAiModel(id: number, values: Partial<Omit<AiModel, 'id' | 'created_at'>>) {
    const setClause = Object.keys(values).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const params = Object.values(values);
    return db.execute(`UPDATE ai_models SET ${setClause} WHERE id = $${params.length + 1}`, [...params, id]);
}

export function deleteAiModel(id: number) {
    return db.execute("DELETE FROM ai_models WHERE id = $1", [id]);
}

// ------------------------- Conversations CRUD -------------------------

// Note: id is now a string (UUID). When creating from frontend, pass the generated id.
export function createConversation(id: string, title?: string, model_id?: number) {
    return db.execute("INSERT INTO conversations (id, title, model_id) VALUES ($1, $2, $3)", [id, title, model_id]);
}

export function getConversation(id: string) {
    return db.select<Conversation[]>("SELECT * FROM conversations WHERE id = $1", [id]);
}

export function getAllConversations() {
    return db.select<Conversation[]>("SELECT * FROM conversations ORDER BY updated_at DESC");
}

export function updateConversation(id: string, values: Partial<Omit<Conversation, 'id' | 'created_at'>>) {
    const setClause = Object.keys(values).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const params = Object.values(values);
    // Also update the updated_at timestamp
    return db.execute(`UPDATE conversations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length + 1}`, [...params, id]);
}

export function deleteConversation(id: string) {
    return db.execute("DELETE FROM conversations WHERE id = $1", [id]);
}

// ------------------------- Messages CRUD -------------------------

export function createMessage(conversation_id: string, role: Message['role'], content: string, tokens_used?: number) {
    return db.execute("INSERT INTO messages (conversation_id, role, content, tokens_used) VALUES ($1, $2, $3, $4)", [conversation_id, role, content, tokens_used]);
}

export function getMessage(id: string) {
    return db.select<Message[]>("SELECT * FROM messages WHERE id = $1", [id]);
}

export function getMessagesForConversation(conversation_id: string) {
    return db.select<Message[]>("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", [conversation_id]);
}

export function getAllMessages() {
    return db.select<Message[]>("SELECT * FROM messages");
}

export function updateMessage(id: string, values: Partial<Omit<Message, 'id' | 'created_at' | 'conversation_id'>>) {
    const setClause = Object.keys(values).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const params = Object.values(values);
    return db.execute(`UPDATE messages SET ${setClause} WHERE id = $${params.length + 1}`, [...params, id]);
}

export function deleteMessage(id: string) {
    return db.execute("DELETE FROM messages WHERE id = $1", [id]);
}