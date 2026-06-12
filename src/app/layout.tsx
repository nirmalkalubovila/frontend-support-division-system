import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeInitializer } from "@/providers/theme-initializer";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Support Division System",
  description:
    "Internal support operations management — issue tracking, time logging, SLA enforcement, and reporting.",
  keywords: ["support", "issue tracking", "your company", "SLA", "time tracking"],
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function getBranding() {
  try {
    const res = await fetch(`${API_URL}/system/branding`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback if backend is unreachable during build or run
  }
  return null;
}

function getLuminance(hex: string) {
  const R = parseInt(hex.substring(1, 3), 16);
  const G = parseInt(hex.substring(3, 5), 16);
  const B = parseInt(hex.substring(5, 7), 16);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function adjustColorBrightness(hex: string, percent: number) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  if (percent > 0) {
    const shift = Math.round((255 * percent) / 100);
    R = Math.max(0, Math.min(255, R + shift));
    G = Math.max(0, Math.min(255, G + shift));
    B = Math.max(0, Math.min(255, B + shift));
  } else {
    R = Math.max(0, Math.min(255, R + (R * percent) / 100));
    G = Math.max(0, Math.min(255, G + (G * percent) / 100));
    B = Math.max(0, Math.min(255, B + (B * percent) / 100));
  }

  const rHex = Math.round(R).toString(16).padStart(2, "0");
  const gHex = Math.round(G).toString(16).padStart(2, "0");
  const bHex = Math.round(B).toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();
  const primaryColor = branding?.primaryColor || "#2dae47"; // default to seeded brand color
  const secondaryColor = adjustColorBrightness(primaryColor, 15);
  const primaryHover = adjustColorBrightness(primaryColor, -15);
  const primaryLight = primaryColor + "1a";
  const secondaryHover = adjustColorBrightness(secondaryColor, -15);
  const secondaryLight = secondaryColor + "1a";

  let primaryText = primaryColor;
  const luminance = getLuminance(primaryColor);
  if (luminance < 100) {
    primaryText = adjustColorBrightness(primaryColor, 150);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${primaryColor} !important;
                --primary-hover: ${primaryHover} !important;
                --primary-light: ${primaryLight} !important;
                --secondary: ${secondaryColor} !important;
                --secondary-hover: ${secondaryHover} !important;
                --secondary-light: ${secondaryLight} !important;
                --primary-text: ${primaryText} !important;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeInitializer />
          {children}
        </QueryProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
