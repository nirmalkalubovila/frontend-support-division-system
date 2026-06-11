import { create } from "zustand";
import { persist } from "zustand/middleware";

// ──────────────────────────────────────────────────────────────
// Theme Store — Light/Dark mode preference
// ──────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  primaryColor: string;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      primaryColor: "#6366f1",
      setTheme: (theme) => set({ theme }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
    }),
    {
      name: "theme-store",
    }
  )
);

export default useThemeStore;
