import { getModelById } from "@/utils/store";
import { ChatProvider } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OpenRouterProvider } from "./openrouter-provider";



export async function getChatProvider(model_id: string): Promise<ChatProvider> {
  const model = await getModelById(model_id);
  switch (model?.provider) {
    case "Gemini":
      return new GeminiProvider();
    case "OpenRouter":
      return new OpenRouterProvider();
    default:
      throw new Error(`Unsupported provider: ${model?.provider}`);
  }
}
