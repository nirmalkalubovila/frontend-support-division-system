"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Wallet,
  AlertCircle,
  CheckCircle2,
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
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import {
  useGetNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/api/services/system/notification-service";

const SOCKET_URL = (() => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return base.replace(/\/api\/v1\/?$/, "");
})();

const SIDEBAR_OPEN = 220;
const SIDEBAR_CLOSED = 56;

// ── Navigation Links (with permission gating) ──────────────────
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/projects", label: "Projects", icon: FolderKanban, permission: "projects.project.read" },
  { href: "/issues", label: "Issues", icon: Ticket, permission: "issues.issue.read", isChildOfProjects: true },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, permission: "projects.project.read", isChildOfProjects: true },
  { href: "/crs", label: "CRs", icon: GitPullRequest, permission: "projects.project.read", isChildOfProjects: true, isLastChild: true },
  { href: "/finance", label: "Finance", icon: Wallet, permission: "finance.payment.read" },
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
  isChildOfProjects,
  isLastChild,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: string | null;
  active: boolean;
  collapsed: boolean;
  isChildOfProjects?: boolean;
  isLastChild?: boolean;
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
        className={`w-full transition-none ${
          collapsed
            ? "justify-center px-0"
            : isChildOfProjects
            ? "justify-start pl-7 relative ml-3 w-[calc(100%-12px)] text-[var(--text-secondary)]"
            : "justify-start"
        }`}
      >
        <Link href={href} className="flex items-center gap-3">
          {isChildOfProjects && !collapsed && (
            <>
              {/* Vertical line connecting children */}
              <span
                className="absolute left-[9px] top-0 w-[1px] bg-[var(--border)]"
                style={{ height: isLastChild ? "50%" : "100%" }}
              />
              {/* L-connector horizontal tick */}
              <span className="absolute left-[9px] top-1/2 -translate-y-1/2 w-2.5 h-[1px] bg-[var(--border)]" />
            </>
          )}
          <Icon className={`${isChildOfProjects ? "h-3.5 w-3.5" : "h-4 w-4"} shrink-0`} />
          {!collapsed && (
            <span className={`${isChildOfProjects ? "text-xs" : ""} whitespace-nowrap`}>{label}</span>
          )}
        </Link>
      </Button>
    </li>
  );
}

// A small client component wrapped in Suspense that calls onSearchParamChange
// to avoid deoptimizing the layout structure.
function SearchParamsTracker({ onSearchParamChange }: { onSearchParamChange: (param: string | null) => void }) {
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project") || searchParams.get("projectId");
  const callbackRef = React.useRef(onSearchParamChange);

  useEffect(() => {
    callbackRef.current = onSearchParamChange;
  });

  useEffect(() => {
    callbackRef.current(projectParam);
  }, [projectParam]);

  return null;
}

// ── AppShell ────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const [projectParam, setProjectParam] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const userInfo = useSessionStore((s) => s.userInfo);
  const accessToken = useSessionStore((s) => s.accessToken);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { theme, setTheme, companyName, slogan, logoUrl } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData } = useGetNotifications({ limit: 5 });
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const notificationsList = notificationsData?.results ?? [];

  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socket.on("connect", () => {
      console.log("Notification socket connected");
    });

    socket.on("new_notification", (notification: any) => {
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });

      // Display premium browser toast
      toast(notification.title || "New Alert", {
        description: notification.message,
        action: notification.relatedLink ? {
          label: "View",
          onClick: () => {
            window.location.href = notification.relatedLink;
          }
        } : undefined,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.readStatus) {
      markReadMutation.mutate(notification._id);
    }
  };

  const getNotificationIcon = (module: string, type: string) => {
    switch (module) {
      case "issues":
        return <Ticket className="h-4 w-4 text-orange-500" />;
      case "tasks":
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "crs":
        return <GitPullRequest className="h-4 w-4 text-purple-500" />;
      default:
        if (type === "error") return <AlertCircle className="h-4 w-4 text-red-500" />;
        if (type === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = mounted ? (companyName || "Prologics Support") : "Prologics Support";
  const displaySlogan = mounted ? (slogan || "Support Division System") : "Support Division System";
  const displayLogo = mounted ? logoUrl : null;

  // Most-specific-match-wins active detection
  const activeHref = useMemo(() => {
    if (pathname === "/issues" && projectParam) {
      return "/projects";
    }
    const sorted = [...NAV_LINKS].sort((a, b) => b.href.length - a.href.length);
    return sorted.find(
      (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
    )?.href;
  }, [pathname, projectParam]);

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
      <Suspense fallback={null}>
        <SearchParamsTracker onSearchParamChange={setProjectParam} />
      </Suspense>
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
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                permission={link.permission}
                active={activeHref === link.href}
                collapsed={collapsed}
                isChildOfProjects={"isChildOfProjects" in link ? link.isChildOfProjects : undefined}
                isLastChild={"isLastChild" in link ? link.isLastChild : undefined}
              />
            ))}
          </ul>
        </nav>
      </aside>

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div
        style={{ marginLeft: sidebarW }}
        className="flex-1 min-w-0 min-h-screen transition-[margin] duration-300 ease-in-out"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-[var(--destructive)] text-white text-[9px] font-bold flex items-center justify-center px-1 animate-pulse-soft border border-[var(--surface)]">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 mt-2 max-h-[450px] overflow-y-auto flex flex-col p-1">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] shrink-0">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Notifications</span>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 text-[10px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>

                <div className="flex-1 divide-y divide-[var(--border)]">
                  {notificationsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <Bell className="h-8 w-8 text-[var(--text-tertiary)] mb-2 stroke-[1.5]" />
                      <p className="text-xs text-[var(--text-secondary)] font-medium">All caught up!</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">No new notifications.</p>
                    </div>
                  ) : (
                    notificationsList.map((notification) => (
                      <DropdownMenuItem 
                        key={notification._id}
                        className={`flex gap-3 px-3 py-2.5 cursor-pointer outline-none transition-colors duration-150 relative ${
                          !notification.readStatus 
                            ? "bg-[rgba(99,102,241,0.04)] hover:bg-[rgba(99,102,241,0.08)]" 
                            : "hover:bg-[var(--background)]"
                        }`}
                        asChild
                      >
                        <Link 
                          href={notification.relatedLink || "#"}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                            {getNotificationIcon(notification.module, notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5 font-sans">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate ${!notification.readStatus ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                                {notification.title}
                              </p>
                              {!notification.readStatus && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[9px] text-[var(--text-tertiary)]">
                              {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
