import { getAPIKeyFromStore, saveAPIKeyToStore } from "@/utils/store";
import { useEffect, useState } from "react";

export enum ProviderName {
	OpenRouter = "OpenRouter",
	Provider2 = "Provider 2",
}

const defaultApiKeys: Record<ProviderName, string> = {
	[ProviderName.OpenRouter]: "openrouter key",
	[ProviderName.Provider2]: "provider2 key",
};

export default function SettingsScreen() {
	const providerNames = Object.values(ProviderName) as ProviderName[];
	const [apiKeys, setApiKeys] = useState<Record<ProviderName, string>>(
		Object.fromEntries(providerNames.map((p) => [p, defaultApiKeys[p]])) as Record<
			ProviderName,
			string
		>
	);

    useEffect(() => {
        const loadKeys = async () => {
            providerNames.forEach(async (provider) => {
                const key = await getAPIKeyFromStore(provider);
                setApiKeys((prev) => ({ ...prev, [provider]: key }));
            });
        };

        loadKeys();
    }, []);

	return (
		<div>
			<h1>Settings</h1>
			<p>Manage your settings here.</p>

			{providerNames.map((provider) => (
				<div key={provider}>
					<h2>{provider}</h2>
					<input
						type="text"
						value={apiKeys[provider] || ""}
						onChange={(e) => setApiKeys({ ...apiKeys, [provider]: e.target.value })}
					/>
					<button onClick={() => saveAPIKeyToStore(provider, apiKeys[provider])}>
						Save
					</button>
				</div>
			))}
		</div>
	);
}
