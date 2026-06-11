import { create } from "zustand";
import { persist } from "zustand/middleware";

// ──────────────────────────────────────────────────────────────
// Theme Store — Light/Dark mode preference
// ──────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-store",
    }
  )
);

export default useThemeStore;
