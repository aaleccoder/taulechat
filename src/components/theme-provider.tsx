import { createContext, useContext, useEffect, useState } from "react";

export const themes = [
  "catppuccin-mocha",
  "graphite",
  "t3chat",
  "vercel",
  "violetbloom",
];

export type Theme = (typeof themes)[number];
export type Mode = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultMode?: Mode;
  storageKeyTheme?: string;
  storageKeyMode?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
};

const initialState: ThemeProviderState = {
  theme: themes[0] as Theme,
  setTheme: () => null,
  mode: "dark",
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = themes[0] as Theme,
  defaultMode = "system",
  storageKeyTheme = "vite-ui-theme",
  storageKeyMode = "vite-ui-mode",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKeyTheme) as Theme) || defaultTheme,
  );
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(storageKeyMode) as Mode) || defaultMode,
  );

  useEffect(() => {
    const root = window.document.documentElement;

    themes.forEach((t) => root.classList.remove(`theme-${t}`));

    root.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (mode === "system") {
      const systemMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemMode);
      return;
    }

    root.classList.add(mode);
  }, [mode]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKeyTheme, newTheme);
      setTheme(newTheme);
    },
    mode,
    setMode: (newMode: Mode) => {
      localStorage.setItem(storageKeyMode, newMode);
      setMode(newMode);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
