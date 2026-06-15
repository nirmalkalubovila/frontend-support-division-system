"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CheckSquare,
  FolderKanban,
  GitPullRequest,
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

const SIDEBAR_OPEN = 220;
const SIDEBAR_CLOSED = 56;

// ── Navigation Links (with permission gating) ──────────────────
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/issues", label: "Issues", icon: Ticket, permission: "issues.issue.read" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, permission: "projects.project.read" },
  { href: "/crs", label: "CRs", icon: GitPullRequest, permission: "projects.project.read" },
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
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const userInfo = useSessionStore((s) => s.userInfo);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { theme, setTheme, companyName, slogan, logoUrl } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = mounted ? (companyName || "Prologics Support") : "Prologics Support";
  const displaySlogan = mounted ? (slogan || "Support Division System") : "Support Division System";
  const displayLogo = mounted ? logoUrl : null;

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
        {/* Header - Only keep collapse button */}
        <div className={`flex items-center h-14 px-3 border-b border-[var(--border)] shrink-0 gap-2 ${collapsed ? "justify-center" : "justify-end"}`}>
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
      </aside>

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div
        style={{ marginLeft: sidebarW }}
        className="flex-1 min-w-0 transition-[margin] duration-300 ease-in-out"
      >
        <header className="sticky top-0 z-20 h-14 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md flex items-center justify-between px-6 relative">
          {/* Left side: Page Title */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              {NAV_LINKS.find((l) => l.href === activeHref)?.label ?? "Dashboard"}
            </h2>
          </div>

          {/* Center: Company Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            {displayLogo ? (
              <div className="h-10 max-w-[240px] shrink-0 flex items-center justify-center">
                <img
                  src={displayLogo}
                  alt={`${displayName} Logo`}
                  className="h-full w-auto object-contain"
                />
              </div>
            ) : (
              <>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-md">
                  <Headset className="h-4.5 w-4.5" />
                </span>
                <div className="text-left hidden sm:block max-w-[180px]">
                  <span className="text-sm font-bold tracking-wide block gradient-text truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] block -mt-0.5 truncate">
                    {displaySlogan}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right side: Theme toggle, Notification bell, Profile dropdown */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--destructive)] animate-pulse-soft" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Profile Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-[var(--border)] overflow-hidden shrink-0">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={userInfo?.avatar ?? ""}
                      alt={userInfo?.name ?? "User"}
                    />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white">
                      {getInitials(userInfo?.name, userInfo?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {userInfo?.name ?? "User"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {userInfo?.email}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {userInfo?.role?.replace("_", " ").toUpperCase() ?? "USER"}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 w-full cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[var(--destructive)] focus:text-[var(--destructive-hover)] cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
