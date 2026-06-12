"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components";
import useSessionStore from "@/store/session-store";
import { useGetMe } from "@/api/services/auth/auth-service";

/**
 * Dashboard layout — wraps all authenticated pages with AppShell.
 * Redirects to /login if not authenticated.
 * Fetches /auth/me on mount to hydrate userInfo.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isLoggedIn = useSessionStore((s) => s.isUserLoggedIn);
  const userInfo = useSessionStore((s) => s.userInfo);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);

  // Fetch user info on mount (re-hydrate from server)
  useGetMe();

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.replace("/login");
    }
  }, [hasHydrated, isLoggedIn, router]);

  // Show loading while checking auth
  if (!hasHydrated || !isLoggedIn || !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
