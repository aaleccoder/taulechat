import { load } from "@tauri-apps/plugin-store";
import { OpenRouterModel, GeminiModel } from "./state";
const store = await load("store.json", {
  autoSave: false,
  defaults: {},
});

const openRouterModelsStore = await load("openrouter-models.json", {
  autoSave: false,
  defaults: {},
});

const geminiModelsStore = await load("gemini-models.json", {
  autoSave: false,
  defaults: {},
});

export const saveDefaultModel = async (model_id: string) => {
  await store.set("default_model", model_id);
  await store.save();
};

export const getDefaultModel = async (): Promise<string | undefined> => {
  return await store.get<string>("default_model");
};

export async function getOpenRouterModelsFromStore(): Promise<
  OpenRouterModel[] | undefined
> {
  return await openRouterModelsStore.get<OpenRouterModel[]>("models");
}

export async function saveOpenRouterModelsToStore(models: OpenRouterModel[]) {
  await openRouterModelsStore.set("models", models);
  await openRouterModelsStore.save();
}

export async function getGeminiModelsFromStore(): Promise<GeminiModel[] | undefined> {
  return await geminiModelsStore.get<GeminiModel[]>("models");
}

export async function saveGeminiModelsToStore(models: GeminiModel[]) {
  await geminiModelsStore.set("models", models);
  await geminiModelsStore.save();
}

export async function getModelsFromStore(): Promise<[OpenRouterModel[], GeminiModel[]]> {
  const openRouterRaw = (await getOpenRouterModelsFromStore()) || [];
  const geminiRaw = (await getGeminiModelsFromStore()) || [];

  // Ensure each model has a provider field and a stable id for UI filtering/selection
  const openRouterModels = openRouterRaw.map((m) => {
    // Prefer existing id; fall back to common fields if needed
    const id = (m as any).id || (m as any).canonical_slug || (m as any).name;
    return {
      ...m,
      id,
      provider: "OpenRouter",
    } as OpenRouterModel;
  });

  const geminiModels = geminiRaw.map((m) => {
    // Gemini schema might not include an explicit id; normalize to name/displayName
    const id = (m as any).id || (m as any).name || (m as any).displayName || (m as any).version || "";
    return {
      ...m,
      id,
      provider: "Gemini",
    } as GeminiModel;
  });

  return [openRouterModels, geminiModels];
}

export async function saveAPIKeyToStore(nameOfKey: string, apiKey: string) {
  await store.set(nameOfKey, apiKey);
  await store.save();
}

export async function getAPIKeyFromStore(nameOfKey: string) {
  return await store.get<string>(nameOfKey);
}

export async function getModelById(id: string): Promise<OpenRouterModel | GeminiModel | undefined> {
  const [openRouterModels, geminiModels] = await getModelsFromStore();
  return (
    openRouterModels.find((model) => model.id === id) ||
    geminiModels.find((model) => model.id === id)
  );
}
