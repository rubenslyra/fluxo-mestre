import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "fluxolab-theme-v1";
type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Ignore storage restrictions.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themeReady, setThemeReady] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    setTheme(getInitialTheme());
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage restrictions.
    }
  }, [isDark, theme, themeReady]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      title="Alternar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
      <span>{isDark ? "Dark" : "Light"}</span>
      <span
        aria-hidden
        className={`relative h-4 w-8 rounded-full border border-border transition ${
          isDark ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-card shadow transition ${
            isDark ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
