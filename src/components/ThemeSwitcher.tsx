import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  const toggleMode = () => {
    if (mode === "system") {
      // If system, decide which mode to switch to. Let's default to toggling based on current system theme.
      const systemIsDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setMode(systemIsDark ? "light" : "dark");
    } else {
      setMode(mode === "dark" ? "light" : "dark");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      className="h-10 w-10 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95"
      aria-label="Toggle light/dark mode"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle mode</span>
    </Button>
  );
}
