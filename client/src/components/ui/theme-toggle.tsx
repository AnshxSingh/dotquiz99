import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed top-5 right-5 w-12 h-12 rounded-full bg-background border-2 border-border cursor-pointer flex items-center justify-center text-xl transition-all duration-300 z-[1000] shadow-md hover:scale-110 hover:shadow-lg dark:bg-card dark:border-border text-foreground"
      title="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
}
