import { useStore, useSidebarConversation, ChatMessage, MessageFile } from "@/utils/state";
import { createMessage, createMessageFile } from "@/lib/database/methods";

export async function initializeNewConversation(id: string, prompt: string, model_id: string) {
  await useStore.getState().createConversation(id, [], model_id, prompt);
  useSidebarConversation.getState().addConversation({ id, model_id, title: prompt });
}

export async function storeUserMessage(conversationId: string, prompt: string, attachments: any[]) {
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    content: prompt,
    role: "user",
    conversation_id: conversationId,
    created_at: new Date().toISOString(),
    files: attachments.slice(0, 2).map((a: any) => ({
      id: a.id,
      message_id: "",
      file_name: a.fileName,
      mime_type: a.mimeType,
      data: a.bytes,
      size: a.size,
      created_at: new Date().toISOString(),
    })) as MessageFile[],
  };
  useStore.getState().addMessage(userMessage);
  await createMessage(userMessage.id, conversationId, "user", userMessage.content);
  for (const a of attachments.slice(0, 2)) {
    try {
      await createMessageFile(a.id, userMessage.id, a.fileName, a.mimeType, a.bytes, a.size);
    } catch (e) {
      console.error("Failed to save attachment:", e);
    }
  }
  return userMessage;
}

export function streamAssistantMessageUpdate(assistantId: string, content: string, metadata?: any, thoughts?: string) {
  const updateData = metadata ? { content, thoughts, ...metadata } : { content, thoughts };
  useStore.getState().updateMessage(assistantId, updateData);
}

export async function finalizeAssistantMessage(assistantId: string, conversationId: string, content: string, metadata?: any, thoughts?: string) {
  await createMessage(
    assistantId,
    conversationId,
    "assistant",
    content,
    undefined,
    metadata ? JSON.stringify(metadata.groundingChunks ?? null) : undefined,
    metadata ? JSON.stringify(metadata.groundingSupports ?? null) : undefined,
    metadata ? JSON.stringify(metadata.webSearchQueries ?? null) : undefined,
    metadata ? JSON.stringify(metadata.usageMetadata ?? null) : undefined,
    metadata ? metadata.modelVersion ?? null : undefined,
    metadata ? metadata.responseId ?? null : undefined,
    thoughts || null
  );
}
