"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  FolderKanban,
  Ticket,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components";
import useSessionStore from "@/store/session-store";
import { ROLE_LABELS } from "@/lib/constants";

// ── Mock Data (will be replaced with real API calls) ──────────
const MANAGER_STATS = [
  { icon: Ticket, label: "Open Issues", value: 24, trend: "+3 today" },
  { icon: AlertTriangle, label: "SLA At Risk", value: 3, trend: "2 critical" },
  { icon: Clock, label: "Avg Resolution", value: "4.2h", trend: "-12% this week" },
  { icon: Users, label: "Active Members", value: 8, trend: "2 idle" },
];

const ENGINEER_STATS = [
  { icon: Ticket, label: "My Open Issues", value: 5, trend: "2 due today" },
  { icon: Timer, label: "Hours Today", value: "3.5h", trend: "of 8h target" },
  { icon: TrendingUp, label: "Resolved This Week", value: 12, trend: "+4 vs last week" },
  { icon: Activity, label: "Pending My Action", value: 2, trend: "> 12h no update" },
];

export default function DashboardPage() {
  const userInfo = useSessionStore((s) => s.userInfo);
  const isManager = userInfo?.role === "super_admin" || userInfo?.role === "manager";

  const stats = isManager ? MANAGER_STATS : ENGINEER_STATS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {isManager ? "Manager Dashboard" : "My Dashboard"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Welcome back, {userInfo?.name ?? "User"} •{" "}
          <span className="text-[var(--primary)]">
            {ROLE_LABELS[userInfo?.role ?? "engineer"]}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Issues Feed */}
        <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--primary)]" />
              {isManager ? "Active Issues Feed" : "My Active Issues"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-[var(--status-in-progress)] animate-pulse-soft" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        Issue placeholder #{i}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        AQF-2026-{String(i).padStart(5, "0")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={i <= 2 ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {i <= 2 ? "Critical" : "Medium"}
                    </Badge>
                    <span className="text-xs text-[var(--text-tertiary)]">2h 15m</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Quick Timer */}
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Timer className="h-4 w-4 text-[var(--primary)]" />
                Quick Timer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <p className="text-3xl font-mono font-bold text-[var(--text-primary)]">
                  00:00:00
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  No active task
                </p>
                <button className="w-full h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                  Start Timer
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Project Hours */}
          {isManager && (
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
                  Project Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["AquaFresh ERP", "SwiftMove CMS", "ElevateSoft"].map((project) => (
                    <div key={project} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-primary)] font-medium">{project}</span>
                        <span className="text-[var(--text-secondary)]">14/20h</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--background)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-500"
                          style={{ width: "70%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SLA Countdown */}
          <Card className="bg-[var(--surface)] border-[var(--border)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
                Resolution Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-sm text-[var(--text-tertiary)]">
                Chart will render here
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
