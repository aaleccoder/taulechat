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
  signal?: AbortSignal;
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

  response_format?: { type: "json_object" };

  transforms?: string[];
  models?: string[];
  route?: "fallback";
  provider?: any;
  user?: string;
  reasoningLevel?: "low" | "medium" | "high";

  tools?: any[];
  tool_choice?: any;

  logit_bias?: { [key: number]: number };
  top_logprobs?: number;
  prediction?: { type: "content"; content: string };
}

export interface ChatProvider {
  formatMessages(
    messages: ChatMessage[],
    options?: { supportsImages?: boolean },
  ): FormattedMessage[];
  streamResponse(
    request: StreamRequest,
  ): Promise<ReadableStreamDefaultReader<Uint8Array>>;
  parseStreamChunk(
    value: Uint8Array,
    decoder: TextDecoder,
  ): { token: string; metadata?: any; thoughts?: string };
}

export class ChatServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatServiceError";
  }
}

export class APIKeyError extends ChatServiceError {
  constructor() {
    super("Invalid or missing API key for this provider.");
    this.name = "APIKeyError";
  }
}

export class RateLimitError extends ChatServiceError {
  constructor() {
    super("You have exceeded the rate limit. Please try again later.");
    this.name = "RateLimitError";
  }
}

export class PaymentRequiredError extends ChatServiceError {
  constructor(message?: string) {
    super(message || "A payment is required to use this model.");
    this.name = "PaymentRequiredError";
  }
}

export class ProviderResponseError extends ChatServiceError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderResponseError";
  }
}

export class NetworkError extends ChatServiceError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIKeyError) {
    return error.message;
  }
  if (error instanceof RateLimitError) {
    return error.message;
  }
  if (error instanceof PaymentRequiredError) {
    return error.message;
  }
  if (error instanceof ProviderResponseError) {
    return `An API error occurred: ${error.message}`;
  }
  if (error instanceof NetworkError) {
    return `Network error: ${error.message}`;
  }
  // Fallback for unexpected errors
  return "An unexpected error occurred. Please check the console for details.";
}
