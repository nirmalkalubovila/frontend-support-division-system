"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  FolderKanban,
  Headset,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Ticket,
  User,
  Users,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Separator,
} from "@/components";
import useSessionStore from "@/store/session-store";
import useThemeStore from "@/store/theme-store";
import { useHasPermission } from "@/hooks/use-permissions";
import { APP_NAME } from "@/lib/constants";

const SIDEBAR_OPEN = 260;
const SIDEBAR_CLOSED = 68;

// ── Navigation Links (with permission gating) ──────────────────
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/issues", label: "Issues", icon: Ticket, permission: "issues.issue.read" },
  { href: "/projects", label: "Projects", icon: FolderKanban, permission: "projects.project.read" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports.daily_report.read" },
  { href: "/users", label: "Users", icon: Users, permission: "user_management.user.read" },
  { href: "/system", label: "System", icon: Settings, permission: "system.settings.read" },
] as const;

// ── Helper ──────────────────────────────────────────────────────
function getInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((t) => t[0]?.toUpperCase())
      .join("");
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

// ── Nav Item with Permission Check ─────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  permission,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: string | null;
  active: boolean;
  collapsed: boolean;
}) {
  const hasPermission = useHasPermission(permission ?? "");
  const userRole = useSessionStore((s) => s.userInfo?.role);

  // Everyone sees Dashboard; permissions guard the rest
  if (permission && userRole !== "super_admin" && !hasPermission) {
    return null;
  }

  return (
    <li>
      <Button
        variant={active ? "default" : "ghost"}
        size="sm"
        asChild
        className={`w-full transition-none ${collapsed ? "justify-center px-0" : "justify-start"}`}
      >
        <Link href={href} className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="whitespace-nowrap">{label}</span>
          )}
        </Link>
      </Button>
    </li>
  );
}

// ── AppShell ────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const userInfo = useSessionStore((s) => s.userInfo);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { theme, setTheme } = useThemeStore();

  // Most-specific-match-wins active detection
  const activeHref = useMemo(() => {
    const sorted = [...NAV_LINKS].sort((a, b) => b.href.length - a.href.length);
    return sorted.find(
      (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
    )?.href;
  }, [pathname]);

  const sidebarW = collapsed ? SIDEBAR_CLOSED : SIDEBAR_OPEN;

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        style={{ width: sidebarW }}
        className="fixed left-0 top-0 h-screen flex flex-col bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden z-30 transition-[width] duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center h-16 px-3 border-b border-[var(--border)] shrink-0 justify-between gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 min-w-0 text-[var(--text-primary)]"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-md">
              <Headset className="h-4.5 w-4.5" />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-sm font-bold tracking-wide whitespace-nowrap overflow-hidden block gradient-text">
                  {APP_NAME}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap block -mt-0.5">
                  Division System
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setCollapsed((p) => !p)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ href, label, icon, permission }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                permission={permission}
                active={activeHref === href}
                collapsed={collapsed}
              />
            ))}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-2 border-t border-[var(--border)] shrink-0 space-y-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "justify-center px-0" : "justify-start"}`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (
              <span className="ml-3 whitespace-nowrap">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </Button>

          <Separator />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center rounded-lg p-2 hover:bg-[var(--surface-hover)] transition-colors text-left ${collapsed ? "justify-center" : "gap-3"}`}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-[var(--border)]">
                  <AvatarImage
                    src={userInfo?.avatar ?? ""}
                    alt={userInfo?.name ?? "User"}
                  />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white">
                    {getInitials(userInfo?.name, userInfo?.email)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {userInfo?.name ?? "User"}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">
                      {userInfo?.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {userInfo?.name ?? "User"}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {userInfo?.email}
                </p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {userInfo?.role?.replace("_", " ").toUpperCase() ?? "USER"}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-[var(--destructive)] focus:text-[var(--destructive-hover)]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div
        style={{ marginLeft: sidebarW }}
        className="flex-1 min-w-0 transition-[margin] duration-300 ease-in-out"
      >
        <header className="sticky top-0 z-20 h-14 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              {NAV_LINKS.find((l) => l.href === activeHref)?.label ?? "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--destructive)] animate-pulse-soft" />
            </Button>
          </div>
        </header>

        {/* ── Main Content ──────────────────────────────────── */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
