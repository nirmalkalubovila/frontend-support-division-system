"use client";

import { useHasPermission } from "@/hooks/use-permissions";
import useSessionStore from "@/store/session-store";
import type { ReactNode } from "react";

// ──────────────────────────────────────────────────────────────
// ValidatePermission — Conditionally renders children based on permission
// ──────────────────────────────────────────────────────────────

interface ValidatePermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ValidatePermission({
  permission,
  children,
  fallback = null,
}: ValidatePermissionProps) {
  const hasPermission = useHasPermission(permission);
  const role = useSessionStore((s) => s.userInfo?.role);

  // Super admin bypasses all permission checks
  if (role === "super_admin" || hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
