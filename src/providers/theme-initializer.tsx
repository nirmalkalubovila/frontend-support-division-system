"use client";

import { useEffect } from "react";
import useThemeStore from "@/store/theme-store";
import { useGetBranding } from "@/api/services/system/settings-service";

function getLuminance(hex: string) {
  // Convert hex to RGB
  const R = parseInt(hex.substring(1, 3), 16);
  const G = parseInt(hex.substring(3, 5), 16);
  const B = parseInt(hex.substring(5, 7), 16);
  // Relative luminance formula
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function adjustColorBrightness(hex: string, percent: number) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  // If we want to lighten, and the color is black/very dark, use an absolute shift
  if (percent > 0) {
    const shift = Math.round((255 * percent) / 100);
    R = Math.max(0, Math.min(255, R + shift));
    G = Math.max(0, Math.min(255, G + shift));
    B = Math.max(0, Math.min(255, B + shift));
  } else {
    // Darken: scale down towards 0
    R = Math.max(0, Math.min(255, R + (R * percent) / 100));
    G = Math.max(0, Math.min(255, G + (G * percent) / 100));
    B = Math.max(0, Math.min(255, B + (B * percent) / 100));
  }

  const rHex = Math.round(R).toString(16).padStart(2, "0");
  const gHex = Math.round(G).toString(16).padStart(2, "0");
  const bHex = Math.round(B).toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Syncs the Zustand theme store with the HTML class and CSS custom variables.
 * Must be a client component rendered in root layout.
 */
export function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const companyName = useThemeStore((s) => s.companyName);
  const slogan = useThemeStore((s) => s.slogan);

  const { data: branding } = useGetBranding();
  const setCompanyName = useThemeStore((s) => s.setCompanyName);
  const setSlogan = useThemeStore((s) => s.setSlogan);
  const setPrimaryColor = useThemeStore((s) => s.setPrimaryColor);
  const setLogoUrl = useThemeStore((s) => s.setLogoUrl);

  useEffect(() => {
    if (branding) {
      setCompanyName(branding.companyName);
      setSlogan(branding.slogan);
      setPrimaryColor(branding.primaryColor);
      setLogoUrl(branding.logoUrl || null);
    }
  }, [branding, setCompanyName, setSlogan, setPrimaryColor, setLogoUrl]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = `${companyName} — ${slogan}`;
    }
  }, [companyName, slogan]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (primaryColor) {
      // Set main primary variables
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--primary-hover", adjustColorBrightness(primaryColor, -15));
      root.style.setProperty("--primary-light", primaryColor + "1a"); // 10% opacity

      // Derive secondary brand colors to match the theme dynamically
      const secondaryColor = adjustColorBrightness(primaryColor, 15);
      root.style.setProperty("--secondary", secondaryColor);
      root.style.setProperty("--secondary-hover", adjustColorBrightness(secondaryColor, -15));
      root.style.setProperty("--secondary-light", secondaryColor + "1a");

      // Calculate readable primary text color based on background theme and luminance
      let primaryText = primaryColor;
      const isDarkTheme = theme === "dark";
      const luminance = getLuminance(primaryColor);

      if (isDarkTheme && luminance < 100) {
        // Lighten the text color for dark mode if primary color is too dark (e.g. black)
        primaryText = adjustColorBrightness(primaryColor, 150); // Shifts to charcoal/white
      } else if (!isDarkTheme && luminance > 200) {
        // Darken the text color for light mode if primary color is too light (e.g. white/yellow)
        primaryText = adjustColorBrightness(primaryColor, -150);
      }

      root.style.setProperty("--primary-text", primaryText);
    }
  }, [primaryColor, theme]);

  return null;
}
export default ThemeInitializer;
