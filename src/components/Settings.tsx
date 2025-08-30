import { getAPIKeyFromStore, saveAPIKeyToStore, getModelsFromStore, addGeminiModel, removeModel } from "@/utils/store";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Model } from "@/utils/state";

export enum ProviderName {
	OpenRouter = "OpenRouter",
	Gemini = "Gemini",
}

const defaultApiKeys: Record<ProviderName, string> = {
	[ProviderName.OpenRouter]: "openrouter key",
	[ProviderName.Gemini]: "gemini key",
};

export default function SettingsScreen() {
	const providerNames = Object.values(ProviderName) as ProviderName[];
	const [apiKeys, setApiKeys] = useState<Record<ProviderName, string>>(
		Object.fromEntries(providerNames.map((p) => [p, defaultApiKeys[p]])) as Record<
			ProviderName,
			string
		>
	);
	const [visibleKeys, setVisibleKeys] = useState<Record<ProviderName, boolean>>(
		Object.fromEntries(providerNames.map((p) => [p, false])) as Record<
			ProviderName,
			boolean
		>
	);
	const [models, setModels] = useState<Model[]>([]);
	const [geminiModelId, setGeminiModelId] = useState<string>("");

	useEffect(() => {
		const loadKeys = async () => {
			const keys = await Promise.all(
				providerNames.map(async (provider) => {
					const key = await getAPIKeyFromStore(provider);
					return { provider, key };
				})
			);
			const newApiKeys = { ...apiKeys };
			keys.forEach(({ provider, key }) => {
				newApiKeys[provider] = key || defaultApiKeys[provider];
			});
			setApiKeys(newApiKeys);
		};
		loadKeys();
	}, []);

	useEffect(() => {
		const loadModels = async () => {
			const fetchedModels = await getModelsFromStore();
			setModels(fetchedModels);
		};
		loadModels();
	}, []);

	return (
		<div className="p-6 bg-background text-foreground min-h-screen">
			<h1 className="text-2xl font-bold mb-6">Settings</h1>
			<p className="mb-6 text-muted-foreground">Manage your API keys here.</p>
			<div className="space-y-4">
				{providerNames.map((provider) => (
					<div key={provider} className="p-4 border border-border rounded-lg bg-card shadow-sm">
						<Label htmlFor={provider} className="text-lg font-semibold mb-2 block text-card-foreground">
							{provider}
						</Label>
						<div className="flex items-center space-x-2 mb-3">
							<Input
								id={provider}
								type={visibleKeys[provider] ? "text" : "password"}
								value={apiKeys[provider] || ""}
								onChange={(e) => setApiKeys({ ...apiKeys, [provider]: e.target.value })}
								className="flex-1"
								placeholder={`Enter your ${provider} API key`}
							/>
							<Button
								onClick={() => setVisibleKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
								variant="ghost"
								size="icon"
								type="button"
							>
								{visibleKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
						</div>
						<Button onClick={() => saveAPIKeyToStore(provider, apiKeys[provider])} variant="default">
							Save
						</Button>
					</div>
				))}
			</div>

			{/* Gemini Models Section */}
			<div className="mt-8">
				<h2 className="text-xl font-bold mb-4">Gemini Models</h2>
				<div className="p-4 border border-border rounded-lg bg-card shadow-sm mb-4">
					<Label className="text-lg font-semibold mb-2 block text-card-foreground">
						Add Gemini Model
					</Label>
					<div className="flex items-center space-x-2">
						<Input
							type="text"
							value={geminiModelId}
							onChange={(e) => setGeminiModelId(e.target.value)}
							placeholder="Enter Gemini model ID (e.g., gemini-1.5-flash)"
							className="flex-1"
						/>
						<Button
							onClick={async () => {
								if (geminiModelId.trim()) {
									await addGeminiModel(geminiModelId.trim());
									setGeminiModelId("");
									// Reload models
									const fetchedModels = await getModelsFromStore();
									setModels(fetchedModels);
								}
							}}
							variant="default"
						>
							<Plus className="h-4 w-4 mr-2" />
							Add
						</Button>
					</div>
				</div>
				<div className="space-y-2">
					{models.filter(model => model.provider === 'Gemini').map((model) => (
						<div key={model.id} className="p-4 border border-border rounded-lg bg-card shadow-sm flex items-center justify-between">
							<div>
								<p className="font-semibold">{model.name}</p>
								<p className="text-sm text-muted-foreground">{model.id}</p>
							</div>
							<Button
								onClick={async () => {
									await removeModel(model.id);
									// Reload models
									const fetchedModels = await getModelsFromStore();
									setModels(fetchedModels);
								}}
								variant="destructive"
								size="sm"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
