import { ChatProvider, FormattedMessage, StreamRequest } from "./types";
import { getBase64FromData } from "@/lib/utils";

import {
  APIKeyError,
  RateLimitError,
  PaymentRequiredError,
  ProviderResponseError,
} from "@/providers/providers-service";

export class OpenRouterProvider implements ChatProvider {
  formatMessages(messages: any[], options?: { supportsImages?: boolean }): FormattedMessage[] {
    return messages.map((m: any) => {
      if (m.role === "user" && (m.files?.length || 0) > 0) {
        const parts: any[] = [];
        if (m.content?.trim()) parts.push({ type: "text", text: m.content });
        if (options?.supportsImages) {
          for (const f of m.files!.slice(0, 2)) {
            if (f.mime_type.startsWith("image/") && options?.supportsImages) {
              const b64 = getBase64FromData(f.data);
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
    // Build the request body
    const requestBody: any = {
      model: request.modelId,
      messages: request.messages,
      stream: true,
      reasoning: { 
        enabled: true 
      },
      usage: {
        include: true
      }
    };

    // Add parameters if provided
    if (request.parameters) {
      const params = request.parameters;
      
      // Handle reasoning level
      if (params.reasoningLevel) {
        const reasoningLevels: { [key: string]: string } = {
          'low': 'low',
          'medium': 'medium', 
          'high': 'high'
        };
        requestBody.reasoning.effort = reasoningLevels[params.reasoningLevel] || 'medium';
      }
      
      // Basic parameters
      if (params.temperature !== undefined) requestBody.temperature = params.temperature;
      if (params.max_tokens !== undefined) requestBody.max_tokens = params.max_tokens;
      if (params.top_p !== undefined) requestBody.top_p = params.top_p;
      if (params.top_k !== undefined) requestBody.top_k = params.top_k;
      
      // Penalty parameters
      if (params.frequency_penalty !== undefined) requestBody.frequency_penalty = params.frequency_penalty;
      if (params.presence_penalty !== undefined) requestBody.presence_penalty = params.presence_penalty;
      if (params.repetition_penalty !== undefined) requestBody.repetition_penalty = params.repetition_penalty;
      
      // Advanced parameters
      if (params.seed !== undefined) requestBody.seed = params.seed;
      if (params.min_p !== undefined) requestBody.min_p = params.min_p;
      if (params.top_a !== undefined) requestBody.top_a = params.top_a;
      
      // Stop sequences
      if (params.stop !== undefined) requestBody.stop = params.stop;
      
      // Response format
      if (params.response_format !== undefined) requestBody.response_format = params.response_format;
      
      // OpenRouter specific
      if (params.transforms !== undefined) requestBody.transforms = params.transforms;
      if (params.models !== undefined) requestBody.models = params.models;
      if (params.route !== undefined) requestBody.route = params.route;
      if (params.provider !== undefined) requestBody.provider = params.provider;
      if (params.user !== undefined) requestBody.user = params.user;
      
      // Tool calling
      if (params.tools !== undefined) requestBody.tools = params.tools;
      if (params.tool_choice !== undefined) requestBody.tool_choice = params.tool_choice;
      
      // Other parameters
      if (params.logit_bias !== undefined) requestBody.logit_bias = params.logit_bias;
      if (params.top_logprobs !== undefined) requestBody.top_logprobs = params.top_logprobs;
      if (params.prediction !== undefined) requestBody.prediction = params.prediction;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey || ""}`,
      },
      body: JSON.stringify(requestBody),
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
