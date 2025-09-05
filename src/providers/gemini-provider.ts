import {
  APIKeyError,
  RateLimitError,
  PaymentRequiredError,
  ProviderResponseError,
  NetworkError
} from "@/providers/providers-service";
import { ChatProvider, FormattedMessage, StreamRequest } from "./types";

export class GeminiProvider implements ChatProvider {
  formatMessages(messages: any[]): FormattedMessage[] {
    return messages.map((m: any) => ({ role: m.role, content: m.content }));
  }

  async streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (request.apiKey) headers["x-goog-api-key"] = request.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.modelId.split("/")[1]}:streamGenerateContent?alt=sse`;
    const body = JSON.stringify({
      contents: request.messages.map((m) => {
        const parts = [{ text: m.content }];
        if (m.role === "user" && request.attachments) {
          return { role: "user", parts: [...parts, ...request.attachments.slice(1)] };
        }
        return { role: m.role === "assistant" ? "model" : "user", parts };
      }),
      tools: [{"google_search": {}} ],
    });
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
      if (!response.ok) {
        let errorMsg = `Gemini error: ${response.status}`;
        let errJson;
        try {
          errJson = await response.json();
        } catch {}
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
        switch (response.status) {
          case 401:
            throw new APIKeyError();
          case 429:
            throw new RateLimitError();
          case 402:
            throw new PaymentRequiredError(errorMsg);
          default:
            throw new ProviderResponseError(errorMsg);
        }
      }
    if (!response.body) throw new Error("Gemini response missing body stream");
    return response.body.getReader();
  }

  parseStreamChunk(value: Uint8Array, decoder: TextDecoder) {
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
    let token = "";
    let metadata: any = {};
    let images: any[] = [];
    for (const line of lines) {
      const jsonStr = line.replace("data: ", "").trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const parts = parsed?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.text) {
            token += part.text;
          } else if (part.inlineData) {
            images.push({
              mimeType: part.inlineData.mime_type || "image/png",
              data: part.inlineData.data,
            });
          }
        }
        metadata = {
          groundingChunks: parsed?.candidates?.[0]?.groundingMetadata?.groundingChunks,
          groundingSupports: parsed?.candidates?.[0]?.groundingMetadata?.groundingSupports,
          webSearchQueries: parsed?.webSearchQueries,
          usageMetadata: parsed?.usageMetadata,
          modelVersion: parsed?.modelVersion,
          responseId: parsed?.responseId,
        };

        console.log(parsed);
      } catch {}
    }
    if (images.length > 0) {
      metadata.images = images;
    }
    return { token, metadata };
  }
}
