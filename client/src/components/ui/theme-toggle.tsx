import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed top-5 right-5 w-12 h-12 rounded-full bg-card border-2 border-border cursor-pointer flex items-center justify-center transition-all duration-300 z-[1000] shadow-md hover:scale-110 hover:shadow-lg text-foreground"
      title="Toggle Dark Mode"
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
    </button>
  );
}
