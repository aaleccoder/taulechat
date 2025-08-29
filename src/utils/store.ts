import { load } from '@tauri-apps/plugin-store';
import { Model } from './state';
const store = await load('store.json', {
    autoSave: false,
    defaults: {}
});

const modelsJson = await load('models.json', {
    autoSave: false,
    defaults: {}
});


export async function getModelsFromStore(): Promise<Model[] | undefined> {
    return await modelsJson.get<Model[]>("models");
}

export async function saveModelsToStore(models: Model[]) {
    await modelsJson.set("models", models);
    await modelsJson.save();
}

export async function saveAPIKeyToStore(nameOfKey: string, apiKey: string) {
    await store.set(nameOfKey, apiKey);
    await store.save();
}

export async function getAPIKeyFromStore(nameOfKey: string) {
    return await store.get<string>(nameOfKey);
}
