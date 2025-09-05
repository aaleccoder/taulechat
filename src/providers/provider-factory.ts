import { getModelById } from "@/utils/store";
import { ChatProvider } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { GeminiImageProvider } from "./gemini-image-provider";
import { OpenRouterProvider } from "./openrouter-provider";

export async function getChatProvider(model_id: string): Promise<ChatProvider> {
  const model = await getModelById(model_id);
  if (model?.provider === "Gemini") {
    const supported = model.supportedGenerationMethods || model.architecture?.supportedGenerationMethods || [];
    if (Array.isArray(supported) && supported.includes("predict")) {
      return new GeminiImageProvider();
    }
    return new GeminiProvider();
  }
  if (model?.provider === "OpenRouter") {
    return new OpenRouterProvider();
  }
  throw new Error(`Unsupported provider: ${model?.provider}`);
}
