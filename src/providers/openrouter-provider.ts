import { ChatProvider, FormattedMessage, StreamRequest } from "./types";

import {
  APIKeyError,
  RateLimitError,
  PaymentRequiredError,
  ProviderResponseError,
} from "@/providers/providers-service";

export class OpenRouterProvider implements ChatProvider {
  formatMessages(messages: any[], options?: { supportsImages?: boolean }): FormattedMessage[] {
    function uint8ToBase64(u8: Uint8Array) {
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < u8.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
      }
      return btoa(binary);
    }
    return messages.map((m: any) => {
      if (m.role === "user" && (m.files?.length || 0) > 0) {
        const parts: any[] = [];
        if (m.content?.trim()) parts.push({ type: "text", text: m.content });
        if (options?.supportsImages) {
          for (const f of m.files!.slice(0, 2)) {
            if (f.mime_type.startsWith("image/")) {
              let b64 = "";
              if (typeof f.data === "string") {
                b64 = f.data;
              } else if (f.data instanceof Uint8Array) {
                b64 = uint8ToBase64(f.data);
              }
              parts.push({ type: "image_url", image_url: { url: `data:${f.mime_type};base64,${b64}` } });
            }
          }
        }
        return { role: m.role, content: parts.length > 0 ? parts : m.content };
      }
      return { role: m.role, content: m.content };
    });
  }

  async streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey || ""}`,
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages,
        stream: true,
        reasoning: { 
          enabled: true 
        },
        usage: {
          include: true
        }
      }),
    });
  if (!response.ok) {
    let errorMsg = `OpenRouter error: ${response.status}`;
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
  if (!response.body) throw new ProviderResponseError("OpenRouter response missing body stream");
    return response.body.getReader();
  }

  parseStreamChunk(value: Uint8Array, decoder: TextDecoder) {
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
    let token = "";
    let thoughts = "";
    let images: any[] = [];
    let usageMetadata: any = null;
    
    for (const line of lines) {
      const jsonStr = line.replace("data: ", "");
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        token += parsed.choices[0]?.delta?.content || "";
        
        const reasoningDetails = parsed.choices[0]?.delta?.reasoning_details || [];
        for (const reasoning of reasoningDetails) {
          if (reasoning.type === "reasoning.text" && reasoning.text) {
            thoughts += reasoning.text;
          }
        }


        console.log(parsed);
        
        if (parsed.usage) {
          usageMetadata = {
            promptTokenCount: parsed.usage.prompt_tokens || 0,
            completionTokenCount: parsed.usage.completion_tokens || 0,
            totalTokenCount: parsed.usage.total_tokens || 0,
            reasoningTokenCount: parsed.usage.completion_tokens_details?.reasoning_tokens || 0,
            imageTokenCount: parsed.usage.completion_tokens_details?.image_tokens || 0,
            cachedTokenCount: parsed.usage.prompt_tokens_details?.cached_tokens || 0,
            audioTokenCount: parsed.usage.prompt_tokens_details?.audio_tokens || 0,
            cost: parsed.usage.cost || 0,
            upstreamCost: parsed.usage.cost_details?.upstream_inference_cost || 0,
            upstreamPromptCost: parsed.usage.cost_details?.upstream_inference_prompt_cost || 0,
            upstreamCompletionsCost: parsed.usage.cost_details?.upstream_inference_completions_cost || 0,
            isByok: parsed.usage.is_byok || false,
          };
        }

        console.log(usageMetadata);
        
        const delta = parsed.choices[0]?.delta;
        if (delta?.images && Array.isArray(delta.images)) {
          for (const img of delta.images) {
            if (img.type === "image_url" && img.image_url?.url) {
              images.push({
                mimeType: img.image_url.url.split(';')[0].split(':')[1] || "image/png",
                dataUrl: img.image_url.url,
                data: img.image_url.url.split(',')[1],
              });
            }
          }
        }
      } catch {}
    }
    const metadata: any = {};
    if (images.length > 0) {
      metadata.images = images;
    }
    if (usageMetadata) {
      metadata.usageMetadata = usageMetadata;
    }
    return { token, metadata, thoughts };
  }
}
