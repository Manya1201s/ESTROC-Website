import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/lib/theme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  testId: string;
}

export default function ThemeToggle({ theme, onToggle, testId }: ThemeToggleProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === "light"}
      data-testid={testId}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}