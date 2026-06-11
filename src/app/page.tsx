"use client";

import { redirect } from "next/navigation";
import useSessionStore from "@/store/session-store";
import { useEffect, useState } from "react";

/**
 * Root page — redirects to dashboard if logged in, otherwise to login.
 */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const isLoggedIn = useSessionStore((s) => s.isUserLoggedIn);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (isLoggedIn) {
        redirect("/dashboard");
      } else {
        redirect("/login");
      }
    }
  }, [mounted, isLoggedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
    </div>
  );
}
