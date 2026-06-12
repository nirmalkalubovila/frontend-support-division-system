import { create } from "zustand";
import { persist } from "zustand/middleware";

// ──────────────────────────────────────────────────────────────
// Theme Store — Light/Dark mode preference
// ──────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  primaryColor: string;
  companyName: string;
  slogan: string;
  logoUrl: string | null;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
  setCompanyName: (name: string) => void;
  setSlogan: (slogan: string) => void;
  setLogoUrl: (logoUrl: string | null) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      primaryColor: "#6366f1",
      companyName: "Your Company (Pvt) Ltd",
      slogan: "Support Division System",
      logoUrl: null,
      setTheme: (theme) => set({ theme }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      setCompanyName: (companyName) => set({ companyName }),
      setSlogan: (slogan) => set({ slogan }),
      setLogoUrl: (logoUrl) => set({ logoUrl }),
    }),
    {
      name: "theme-store",
    }
  )
);

export default useThemeStore;
