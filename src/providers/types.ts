import { ChatMessage, GeminiTool } from "@/utils/state";

export type FormattedMessage = {
  role: string;
  content: any;
};

export interface StreamRequest {
  modelId: string;
  messages: FormattedMessage[];
  apiKey: string | null;
  attachments?: any[];
  parameters?: ModelParameters;
  modelInfo?: any; // Add model information
}

export interface ModelParameters {
  // Basic parameters
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  
  // Penalty parameters
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  
  // Gemini-specific parameters
  candidate_count?: number;
  stop_sequences?: string[];
  gemini_tools?: GeminiTool[];
  gemini_thinking?: boolean;
  
  // Advanced parameters
  seed?: number;
  min_p?: number;
  top_a?: number;
  
  // Stop sequences
  stop?: string | string[];
  
  // Response format
  response_format?: { type: 'json_object' };
  
  // OpenRouter specific
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  provider?: any;
  user?: string;
  reasoningLevel?: 'low' | 'medium' | 'high';
  
  // Tool calling
  tools?: any[];
  tool_choice?: any;
  
  // Other parameters
  logit_bias?: { [key: number]: number };
  top_logprobs?: number;
  prediction?: { type: 'content'; content: string };
}

export interface ChatProvider {
  formatMessages(messages: ChatMessage[], options?: { supportsImages?: boolean }): FormattedMessage[];
  streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>>;
  parseStreamChunk(value: Uint8Array, decoder: TextDecoder): { token: string; metadata?: any; thoughts?: string };
}
