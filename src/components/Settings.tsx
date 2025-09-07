import { getAPIKeyFromStore, saveAPIKeyToStore } from "@/utils/store";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "./theme-provider";

export enum ProviderName {
  OpenRouter = "OpenRouter",
  Gemini = "Gemini",
}

const defaultApiKeys: Record<ProviderName, string> = {
  [ProviderName.OpenRouter]: "openrouter key",
  [ProviderName.Gemini]: "gemini key",
};

export default function SettingsScreen() {
  const { theme, setTheme, mode, setMode } = useTheme();
  const providerNames = Object.values(ProviderName) as ProviderName[];
  const [apiKeys, setApiKeys] = useState<Record<ProviderName, string>>(
    Object.fromEntries(
      providerNames.map((p) => [p, defaultApiKeys[p]]),
    ) as Record<ProviderName, string>,
  );
  const [visibleKeys, setVisibleKeys] = useState<Record<ProviderName, boolean>>(
    Object.fromEntries(providerNames.map((p) => [p, false])) as Record<
      ProviderName,
      boolean
    >,
  );

  useEffect(() => {
    const loadKeys = async () => {
      const keys = await Promise.all(
        providerNames.map(async (provider) => {
          const key = await getAPIKeyFromStore(provider);
          return { provider, key };
        }),
      );
      const newApiKeys = { ...apiKeys };
      keys.forEach(({ provider, key }) => {
        newApiKeys[provider] = key || defaultApiKeys[provider];
      });
      setApiKeys(newApiKeys);
    };
    loadKeys();
  }, []);

  return (
    <div className="p-6 bg-background text-foreground h-[90vh] overflow-auto pt-20">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="mb-8 p-4 border border-border rounded-lg bg-card shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-card-foreground">
          Appearance
        </h2>
        <p className="mb-4 text-muted-foreground text-sm">
          Select a theme and mode for the application.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graphite">graphite</SelectItem>
                <SelectItem value="vercel">Vercel</SelectItem>
                <SelectItem value="t3chat">T3Chat</SelectItem>
                <SelectItem value="catppuccin-mocha">
                  Catppuccin Mocha
                </SelectItem>
                <SelectItem value="violetbloom">Violet Bloom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="mode-select">Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger id="mode-select">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <p className="mb-6 text-muted-foreground">Manage your API keys here.</p>
      <div className="space-y-4  overflow-y-auto">
        {providerNames.map((provider) => (
          <div
            key={provider}
            className="p-4 border border-border rounded-lg bg-card shadow-sm"
          >
            <Label
              htmlFor={provider}
              className="text-lg font-semibold mb-2 block text-card-foreground"
            >
              {provider}
            </Label>
            <div className="flex items-center space-x-2 mb-3">
              <Input
                id={provider}
                type={visibleKeys[provider] ? "text" : "password"}
                value={apiKeys[provider] || ""}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, [provider]: e.target.value })
                }
                className="flex-1"
                placeholder={`Enter your ${provider} API key`}
              />
              <Button
                onClick={() =>
                  setVisibleKeys((prev) => ({
                    ...prev,
                    [provider]: !prev[provider],
                  }))
                }
                variant="ghost"
                size="icon"
                type="button"
              >
                {visibleKeys[provider] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              onClick={() => saveAPIKeyToStore(provider, apiKeys[provider])}
              variant="default"
            >
              Save
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
