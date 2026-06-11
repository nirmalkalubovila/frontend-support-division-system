import useSessionStore from "@/store/session-store";

// ──────────────────────────────────────────────────────────────
// Permission Hook — check if current user has specific permissions
// ──────────────────────────────────────────────────────────────

/**
 * Check if the current user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const userInfo = useSessionStore((s) => s.userInfo);
  if (!userInfo) return false;
  // Super admin has all permissions
  if (userInfo.role === "super_admin") return true;
  return userInfo.permissions.includes(permission);
}

/**
 * Check if the current user has ANY of the specified permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const userInfo = useSessionStore((s) => s.userInfo);
  if (!userInfo) return false;
  if (userInfo.role === "super_admin") return true;
  return permissions.some((p) => userInfo.permissions.includes(p));
}

/**
 * Check if the current user has ALL of the specified permissions
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const userInfo = useSessionStore((s) => s.userInfo);
  if (!userInfo) return false;
  if (userInfo.role === "super_admin") return true;
  return permissions.every((p) => userInfo.permissions.includes(p));
}

/**
 * Get the current user's role
 */
export function useUserRole() {
  return useSessionStore((s) => s.userInfo?.role ?? null);
}
