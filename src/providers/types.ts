import { ChatMessage } from "@/utils/state";

export type FormattedMessage = {
  role: string;
  content: any;
};

export interface StreamRequest {
  modelId: string;
  messages: FormattedMessage[];
  apiKey: string | null;
  attachments?: any[];
}

export interface ChatProvider {
  formatMessages(messages: ChatMessage[], options?: { supportsImages?: boolean }): FormattedMessage[];
  streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>>;
  parseStreamChunk(value: Uint8Array, decoder: TextDecoder): { token: string; metadata?: any; thoughts?: string };
}
