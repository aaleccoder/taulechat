import { load } from "@tauri-apps/plugin-store";
import { Model } from "./state";
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
  Model[] | undefined
> {
  return await openRouterModelsStore.get<Model[]>("models");
}

export async function saveOpenRouterModelsToStore(models: Model[]) {
  await openRouterModelsStore.set("models", models);
  await openRouterModelsStore.save();
}

export async function getGeminiModelsFromStore(): Promise<Model[] | undefined> {
  return await geminiModelsStore.get<Model[]>("models");
}

export async function saveGeminiModelsToStore(models: Model[]) {
  await geminiModelsStore.set("models", models);
  await geminiModelsStore.save();
}

export async function getModelsFromStore(): Promise<Model[]> {
  const openRouterModels = (await getOpenRouterModelsFromStore()) || [];
  const geminiModels = (await getGeminiModelsFromStore()) || [];
  return [...openRouterModels, ...geminiModels];
}

export async function addGeminiModel(id: string) {
  const currentModels = (await getGeminiModelsFromStore()) || [];
  const name = id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()); // e.g., gemini-1.5-flash -> Gemini 1.5 Flash
  const newModel: Model = {
    id,
    name,
    provider: "Gemini",
    // other fields optional
  };
  const updatedModels = [...currentModels, newModel];
  await saveGeminiModelsToStore(updatedModels);
}

export async function removeModel(id: string) {
  // Check both stores and remove from the appropriate one
  const openRouterModels = (await getOpenRouterModelsFromStore()) || [];
  const geminiModels = (await getGeminiModelsFromStore()) || [];

  const openRouterModel = openRouterModels.find((model) => model.id === id);
  const geminiModel = geminiModels.find((model) => model.id === id);

  if (openRouterModel) {
    const updatedModels = openRouterModels.filter((model) => model.id !== id);
    await saveOpenRouterModelsToStore(updatedModels);
  } else if (geminiModel) {
    const updatedModels = geminiModels.filter((model) => model.id !== id);
    await saveGeminiModelsToStore(updatedModels);
  }
}

export async function saveAPIKeyToStore(nameOfKey: string, apiKey: string) {
  await store.set(nameOfKey, apiKey);
  await store.save();
}

export async function getAPIKeyFromStore(nameOfKey: string) {
  return await store.get<string>(nameOfKey);
}

export async function getModelById(id: string): Promise<Model | undefined> {
  const allModels = await getModelsFromStore();
  return allModels.find((model) => model.id === id);
}
