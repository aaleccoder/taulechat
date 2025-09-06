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
  modelInfo?: any; 
}

export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  
  candidate_count?: number;
  stop_sequences?: string[];
  gemini_tools?: GeminiTool[];
  gemini_thinking?: boolean;
  
  seed?: number;
  min_p?: number;
  top_a?: number;
  
  stop?: string | string[];
  
  response_format?: { type: 'json_object' };
  
  transforms?: string[];
  models?: string[];
  route?: 'fallback';
  provider?: any;
  user?: string;
  reasoningLevel?: 'low' | 'medium' | 'high';
  
  tools?: any[];
  tool_choice?: any;
  
  logit_bias?: { [key: number]: number };
  top_logprobs?: number;
  prediction?: { type: 'content'; content: string };
}

export interface ChatProvider {
  formatMessages(messages: ChatMessage[], options?: { supportsImages?: boolean }): FormattedMessage[];
  streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>>;
  parseStreamChunk(value: Uint8Array, decoder: TextDecoder): { token: string; metadata?: any; thoughts?: string };
}
