import { createContext, useContext, useEffect, useState } from "react";

export const themes = [
  "catppuccin",
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
  theme: "catppuccin",
  setTheme: () => null,
  mode: "dark",
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "catppuccin",
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

    const apply = () => {
      themes.forEach((t) => root.classList.remove(`theme-${t}`));
      root.classList.add(`theme-${theme}`);

      root.classList.remove("light", "dark");
      const resolvedMode =
        mode === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : mode;
      root.classList.add(resolvedMode);
    };

    apply();

    let mql: MediaQueryList | null = null;
    const onChange = () => apply();

    if (mode === "system") {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
      } else if (typeof mql.addListener === "function") {
        mql.addListener(onChange);
      }
    }

    return () => {
      if (mql) {
        if (typeof mql.removeEventListener === "function") {
          mql.removeEventListener("change", onChange);
        } else if (typeof mql.removeListener === "function") {
          mql.removeListener(onChange);
        }
      }
    };
  }, [theme, mode]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (themes.includes(newTheme)) {
        setTheme(newTheme);
      } else {
        setTheme(defaultTheme);
      }
      localStorage.setItem(storageKeyTheme, newTheme);
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
