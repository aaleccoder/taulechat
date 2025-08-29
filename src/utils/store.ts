import { load } from '@tauri-apps/plugin-store';
const store = await load('store.json', {
    autoSave: false,
    defaults: {}
});

export async function saveAPIKeyToStore(nameOfKey: string, apiKey: string) {
    await store.set(nameOfKey, apiKey);
    await store.save();
}

export async function getAPIKeyFromStore(nameOfKey: string) {
    return await store.get<string>(nameOfKey);
}
