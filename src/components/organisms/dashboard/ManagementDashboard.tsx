"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  FolderKanban,
  Ticket,
  Users,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatCard } from "@/components/atoms/statCard";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import type { Issue } from "@/api/services/issue-management/issue-service";
import type { Project } from "@/api/services/project-management/project-service";
import type { UserInfo } from "@/types/global-types";

interface ManagementDashboardProps {
  issues: Issue[];
  projects: Project[];
  users: UserInfo[];
}

export function ManagementDashboard({ issues, projects, users }: ManagementDashboardProps) {
  // ──────────────────────────────────────────────────────────────
  // SLA & General KPIs
  // ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalOpen = issues.filter(
      (i) => i.status !== "Resolved" && i.status !== "Closed"
    ).length;

    const completed = issues.filter((i) =>
      ["Resolved", "Closed"].includes(i.status)
    );

    // SLA Compliance rate
    let slaComplianceRate = 100;
    if (completed.length > 0) {
      const withinSla = completed.filter((i) => {
        const resolutionTime = new Date(i.updatedAt).getTime();
        const dueTime = new Date(i.dueDate).getTime();
        return resolutionTime <= dueTime;
      }).length;
      slaComplianceRate = Math.round((withinSla / completed.length) * 100);
    }

    // SLA At Risk (overdue and not resolved)
    const slaAtRisk = issues.filter(
      (i) =>
        i.status !== "Resolved" &&
        i.status !== "Closed" &&
        new Date(i.dueDate) < new Date()
    ).length;

    // Avg Resolution Time
    let avgResolutionStr = "N/A";
    if (completed.length > 0) {
      const totalDurationHours = completed.reduce((acc, curr) => {
        const start = new Date(curr.createdAt).getTime();
        const end = new Date(curr.updatedAt).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
      const avg = totalDurationHours / completed.length;
      avgResolutionStr = avg < 1 ? `${Math.round(avg * 60)}m` : `${avg.toFixed(1)}h`;
    }

    const activeUsers = users.filter((u) => u.isActive).length;

    return {
      totalOpen,
      slaComplianceRate,
      slaAtRisk,
      avgResolutionStr,
      activeUsers,
    };
  }, [issues, users]);

  // ──────────────────────────────────────────────────────────────
  // 7-Day Trend Chart Data
  // ──────────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return {
        dateStr: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateKey: d.toDateString(),
        created: 0,
        resolved: 0,
      };
    });

    issues.forEach((issue) => {
      const createDate = new Date(issue.createdAt).toDateString();
      const foundCreated = days.find((day) => day.dateKey === createDate);
      if (foundCreated) {
        foundCreated.created += 1;
      }

      if (["Resolved", "Closed"].includes(issue.status)) {
        const updateDate = new Date(issue.updatedAt).toDateString();
        const foundResolved = days.find((day) => day.dateKey === updateDate);
        if (foundResolved) {
          foundResolved.resolved += 1;
        }
      }
    });

    return days;
  }, [issues]);

  // ──────────────────────────────────────────────────────────────
  // Issue Status Pie Chart
  // ──────────────────────────────────────────────────────────────
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, value]) => ({
      name: status,
      value,
    }));
  }, [issues]);

  // Status colors matching application CSS tokens
  const STATUS_COLORS: Record<string, string> = {
    Backlog: "var(--status-backlog)",
    Assigned: "var(--status-assigned)",
    "Planned Solution": "var(--status-planned)",
    "In Progress": "var(--status-in-progress)",
    Testing: "var(--status-testing)",
    "On Hold": "var(--status-on-hold)",
    "Pending Client": "var(--status-pending-client)",
    Resolved: "var(--status-resolved)",
    Closed: "var(--status-closed)",
    Reopened: "var(--status-reopened)",
  };

  // ──────────────────────────────────────────────────────────────
  // High-Priority and SLA Alert lists
  // ──────────────────────────────────────────────────────────────
  const criticalIssues = useMemo(() => {
    return issues
      .filter(
        (i) =>
          ["Critical", "High"].includes(i.priority) &&
          !["Resolved", "Closed"].includes(i.status)
      )
      .slice(0, 5);
  }, [issues]);

  const slaBreaches = useMemo(() => {
    return issues
      .filter((i) => {
        const isOverdue = new Date(i.dueDate) < new Date();
        const isActive = !["Resolved", "Closed"].includes(i.status);
        return isOverdue && isActive;
      })
      .slice(0, 5);
  }, [issues]);

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Open Issues"
          value={metrics.totalOpen}
          trend="Requires attention"
          trendClassName="text-[var(--flat-orange)]"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={TrendingUp}
          label="SLA Compliance"
          value={`${metrics.slaComplianceRate}%`}
          trend="Target: 95%+"
          trendClassName="text-[var(--flat-peter-river)]"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={AlertTriangle}
          label="SLA At Risk"
          value={metrics.slaAtRisk}
          trend={metrics.slaAtRisk > 0 ? `${metrics.slaAtRisk} overdue` : "Compliant"}
          trendClassName={metrics.slaAtRisk > 0 ? "text-[var(--flat-alizarin)]" : "text-[var(--flat-emerald)]"}
          className={`hover:scale-[1.01] transition-transform duration-200 ${
            metrics.slaAtRisk > 0 ? "border-[var(--destructive)] bg-[rgba(239,68,68,0.02)]" : ""
          }`}
        />
        <StatCard
          icon={Users}
          label="Active Staff Members"
          value={metrics.activeUsers}
          trend={`${users.length} total users`}
          trendClassName="text-[var(--flat-peter-river)]"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-[var(--primary-text)]" />
              7-Day Ticket Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dateStr"
                  stroke="var(--text-tertiary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--text-tertiary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="New Tickets"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="var(--success)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-[var(--primary-text)]" />
              Ticket Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[280px]">
            {statusChartData.length === 0 ? (
              <div className="text-xs text-[var(--text-tertiary)]">No ticket data available</div>
            ) : (
              <>
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[entry.name] || "var(--primary)"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border)",
                          borderRadius: "var(--radius)",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Scrollable Legend */}
                <div className="w-full flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2 overflow-y-auto max-h-[75px] text-[10px] font-medium text-[var(--text-secondary)]">
                  {statusChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[entry.name] || "var(--primary)" }}
                      />
                      <span>
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Project Hours and Priority Alert Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Hours Allocation Progress */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FolderKanban className="h-4.5 w-4.5 text-[var(--primary-text)]" />
              Project Hours Allocation
            </CardTitle>
            <Link href="/projects" className="text-xs text-[var(--primary-text)] hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                No active projects
              </div>
            ) : (
              projects.slice(0, 5).map((project) => {
                const allocated = project.allocatedHours || 0;
                const used = project.usedHours || 0;
                const ratio = allocated > 0 ? (used / allocated) * 100 : 0;
                const percent = Math.min(Math.round(ratio), 100);

                return (
                  <div key={project._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-primary)] truncate max-w-[170px]">
                        {project.name}
                      </span>
                      <span className="text-[var(--text-secondary)] font-mono">
                        {used}/{allocated}h ({percent}%)
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      indicatorClassName={
                        percent > 90
                          ? "bg-[var(--destructive)]"
                          : percent > 75
                          ? "bg-amber-500"
                          : "bg-[var(--primary)]"
                      }
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* High Priority Unassigned/Assigned Tickets */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-[var(--destructive)]" />
              Critical & High Queue
            </CardTitle>
            <Link href="/issues" className="text-xs text-[var(--primary-text)] hover:underline">
              View Board
            </Link>
          </CardHeader>
          <CardContent>
            {criticalIssues.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                No critical issues pending.
              </div>
            ) : (
              <div className="space-y-3">
                {criticalIssues.map((issue) => {
                  const client = typeof issue.client === "object" ? issue.client : null;
                  return (
                    <Link key={issue._id} href="/issues">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-xs transition-all cursor-pointer">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {issue.title}
                          </p>
                          <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                            {issue.issueId} • {client?.code ?? "No Client"}
                          </div>
                        </div>
                        <Badge
                          variant={issue.priority === "Critical" ? "destructive" : "default"}
                          className="text-[9px] uppercase scale-90 shrink-0"
                        >
                          {issue.priority}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA Breaches / Overdue Panel */}
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              SLA Breaches / Overdue
            </CardTitle>
            <Link href="/issues" className="text-xs text-[var(--primary-text)] hover:underline">
              Check
            </Link>
          </CardHeader>
          <CardContent>
            {slaBreaches.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                All active tickets within SLA!
              </div>
            ) : (
              <div className="space-y-3">
                {slaBreaches.map((issue) => {
                  const daysOverdue = Math.round(
                    (new Date().getTime() - new Date(issue.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Link key={issue._id} href="/issues">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.3)] transition-all cursor-pointer">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {issue.title}
                          </p>
                          <div className="text-[10px] text-[var(--destructive)] font-mono mt-0.5">
                            {issue.issueId} • Overdue by {daysOverdue}d
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-[var(--destructive)] border-[var(--destructive)] scale-90 shrink-0">
                          Breached
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
