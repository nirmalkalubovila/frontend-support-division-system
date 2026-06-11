import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeInitializer } from "@/providers/theme-initializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Prologics Support Division System",
  description:
    "Internal support operations management — issue tracking, time logging, SLA enforcement, and reporting for Prologics (Pvt) Ltd.",
  keywords: ["support", "issue tracking", "prologics", "SLA", "time tracking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeInitializer />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
