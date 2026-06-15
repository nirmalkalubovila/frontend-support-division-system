"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Play,
  Pause,
  Square,
  ChevronRight,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components";
import { StatCard } from "@/components/atoms/statCard";
import { Progress } from "@/components/ui/progress";
import useSessionStore from "@/store/session-store";
import { ROLE_LABELS } from "@/lib/constants";
import { useGetIssues, type Issue } from "@/api/services/issue-management/issue-service";
import { useGetAllProjects } from "@/api/services/project-management/project-service";
import { useGetAllUsers } from "@/api/services/user-management/user-service";

export default function DashboardPage() {
  const userInfo = useSessionStore((s) => s.userInfo);
  const isManager = userInfo?.role === "super_admin" || userInfo?.role === "manager";

  // ──────────────────────────────────────────────────────────────
  // API Queries
  // ──────────────────────────────────────────────────────────────
  const { data: issuesData, isLoading: isIssuesLoading } = useGetIssues({
    limit: 500,
    sortBy: "updatedAt:desc",
  });

  const { data: projectsData, isLoading: isProjectsLoading } = useGetAllProjects();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers();

  const issues = useMemo(() => issuesData?.data ?? [], [issuesData]);
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData]);
  const users = useMemo(() => usersData ?? [], [usersData]);

  // ──────────────────────────────────────────────────────────────
  // Stopwatch State & Logic (WOW Feature)
  // ──────────────────────────────────────────────────────────────
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [time, setTime] = useState<number>(0);
  const [isTicking, setIsTicking] = useState<boolean>(false);

  // Sync the timer values and ticking status for the selected issue ID
  useEffect(() => {
    const syncTimer = () => {
      if (!selectedIssueId) {
        setTime(0);
        setIsTicking(false);
        return;
      }

      const savedTime = localStorage.getItem(`issue_timer_${selectedIssueId}`);
      const savedTicking = localStorage.getItem(`issue_timer_ticking_${selectedIssueId}`);
      const savedTimestamp = localStorage.getItem(`issue_timer_timestamp_${selectedIssueId}`);

      if (savedTicking === "true" && savedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
        setTime((savedTime ? parseInt(savedTime, 10) : 0) + elapsed);
        setIsTicking(true);
      } else {
        setTime(savedTime ? parseInt(savedTime, 10) : 0);
        setIsTicking(false);
      }
    };

    syncTimer();
    window.addEventListener("storage", syncTimer);
    return () => {
      window.removeEventListener("storage", syncTimer);
    };
  }, [selectedIssueId]);

  // Tick the stopwatch specifically for the active selected issue
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTicking && selectedIssueId) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(`issue_timer_${selectedIssueId}`, String(newTime));
          localStorage.setItem(`issue_timer_timestamp_${selectedIssueId}`, String(Date.now()));
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTicking, selectedIssueId]);

  // Auto-select the first active issue on page load
  useEffect(() => {
    if (issues.length > 0 && !selectedIssueId) {
      const activeOnly = issues.filter((i) => i.status !== "Resolved" && i.status !== "Closed");
      if (activeOnly.length > 0) {
        setSelectedIssueId(activeOnly[0]._id);
      }
    }
  }, [issues, selectedIssueId]);

  const handleStartTimer = () => {
    if (!selectedIssueId) return;
    setIsTicking(true);
    localStorage.setItem(`issue_timer_ticking_${selectedIssueId}`, "true");
    localStorage.setItem(`issue_timer_timestamp_${selectedIssueId}`, String(Date.now()));
    window.dispatchEvent(new Event("storage"));
  };

  const handlePauseTimer = () => {
    if (!selectedIssueId) return;
    setIsTicking(false);
    localStorage.setItem(`issue_timer_ticking_${selectedIssueId}`, "false");
    localStorage.removeItem(`issue_timer_timestamp_${selectedIssueId}`);
    window.dispatchEvent(new Event("storage"));
  };

  const handleStopTimer = () => {
    if (!selectedIssueId) return;
    setIsTicking(false);
    setTime(0);
    localStorage.removeItem(`issue_timer_${selectedIssueId}`);
    localStorage.removeItem(`issue_timer_ticking_${selectedIssueId}`);
    localStorage.removeItem(`issue_timer_timestamp_${selectedIssueId}`);
    window.dispatchEvent(new Event("storage"));
  };

  const formatStopwatchTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  // Filter active issues to populate the stopwatch select dropdown
  const userActiveIssues = useMemo(() => {
    return issues.filter((i) => i.status !== "Resolved" && i.status !== "Closed");
  }, [issues]);

  const selectedIssueObject = useMemo(() => {
    return issues.find((i) => i._id === selectedIssueId);
  }, [issues, selectedIssueId]);

  // ──────────────────────────────────────────────────────────────
  // Stats Calculations
  // ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (isIssuesLoading) return [];

    if (isManager) {
      const openIssuesCount = issues.filter(
        (i) => i.status !== "Resolved" && i.status !== "Closed"
      ).length;

      const slaAtRiskCount = issues.filter(
        (i) =>
          i.status !== "Resolved" &&
          i.status !== "Closed" &&
          new Date(i.dueDate) < new Date()
      ).length;

      const completed = issues.filter((i) =>
        ["Resolved", "Closed"].includes(i.status)
      );
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

      const activeMembersCount = users.filter((u) => u.isActive).length;

      return [
        { icon: Ticket, label: "Open Issues", value: openIssuesCount, trend: "Requires attention" },
        {
          icon: AlertTriangle,
          label: "SLA At Risk",
          value: slaAtRiskCount,
          trend: slaAtRiskCount > 0 ? `${slaAtRiskCount} overdue` : "All within SLA",
        },
        { icon: Clock, label: "Avg Resolution", value: avgResolutionStr, trend: "Based on closed tasks" },
        { icon: Users, label: "Active Members", value: activeMembersCount, trend: `${users.length} total users` },
      ];
    } else {
      const myOpenIssues = issues.filter(
        (i) => i.status !== "Resolved" && i.status !== "Closed"
      ).length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const resolvedThisWeek = issues.filter(
        (i) =>
          ["Resolved", "Closed"].includes(i.status) &&
          new Date(i.updatedAt) >= sevenDaysAgo
      ).length;

      const pendingMyAction = issues.filter((i) =>
        ["Assigned", "Reopened", "Testing"].includes(i.status)
      ).length;

      const stopwatchHoursStr = (time / 3600).toFixed(1) + "h";

      return [
        { icon: Ticket, label: "My Open Issues", value: myOpenIssues, trend: "Assigned to me" },
        { icon: Timer, label: "Hours Tracked", value: stopwatchHoursStr, trend: "Current session timer" },
        { icon: TrendingUp, label: "Resolved (7d)", value: resolvedThisWeek, trend: "Closed in last 7 days" },
        { icon: Activity, label: "Pending My Action", value: pendingMyAction, trend: "In active status" },
      ];
    }
  }, [isManager, issues, users, time, isIssuesLoading]);

  // ──────────────────────────────────────────────────────────────
  // Active Issues Feed (Top 5)
  // ──────────────────────────────────────────────────────────────
  const feedIssues = useMemo(() => {
    const activeOnly = issues.filter(
      (i) => i.status !== "Resolved" && i.status !== "Closed"
    );
    return activeOnly.slice(0, 5);
  }, [issues]);

  // ──────────────────────────────────────────────────────────────
  // Resolution Trend Chart Data
  // ──────────────────────────────────────────────────────────────
  const chartPoints = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return {
        dateStr: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateKey: d.toDateString(),
        count: 0,
      };
    });

    issues.forEach((issue) => {
      if (["Resolved", "Closed"].includes(issue.status)) {
        const updateDate = new Date(issue.updatedAt).toDateString();
        const found = last7Days.find((day) => day.dateKey === updateDate);
        if (found) {
          found.count += 1;
        }
      }
    });

    return last7Days;
  }, [issues]);

  const maxChartCount = useMemo(() => {
    const maxVal = Math.max(...chartPoints.map((p) => p.count), 0);
    return maxVal === 0 ? 5 : maxVal;
  }, [chartPoints]);

  if (isIssuesLoading || isProjectsLoading || (isManager && isUsersLoading)) {
    return (
      <div className="space-y-6">
        <div className="h-14 w-1/3 bg-[var(--surface-hover)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[var(--surface-hover)] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-[var(--surface-hover)] rounded-xl animate-pulse" />
          <div className="h-[350px] bg-[var(--surface-hover)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {isManager ? "Manager Dashboard" : "My Dashboard"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Welcome back, {userInfo?.name ?? "User"} •{" "}
          <span className="text-[var(--primary-text)] font-semibold">
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
        <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-[var(--primary-text)] animate-pulse-soft" />
              {isManager ? "Active Issues Feed" : "My Active Issues"}
            </CardTitle>
            <Link
              href="/issues"
              className="text-xs text-[var(--primary-text)] hover:underline flex items-center gap-0.5"
            >
              View Board <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {feedIssues.length === 0 ? (
              <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">
                No active issues found.
              </div>
            ) : (
              <div className="space-y-3">
                {feedIssues.map((issue) => {
                  const client = typeof issue.client === "object" ? issue.client : null;
                  const project = typeof issue.project === "object" ? issue.project : null;
                  
                  const isOverdue =
                    new Date(issue.dueDate) < new Date() &&
                    !["Resolved", "Closed"].includes(issue.status);

                  // Retrieve this specific issue's stopwatch state
                  const isTickingForThisIssue = typeof window !== "undefined" && localStorage.getItem(`issue_timer_ticking_${issue._id}`) === "true";
                  const elapsedSeconds = typeof window !== "undefined" ? parseInt(localStorage.getItem(`issue_timer_${issue._id}`) || "0", 10) : 0;

                  return (
                    <Link key={issue._id} href="/issues">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-sm transition-all duration-200 cursor-pointer mb-2 last:mb-0">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isOverdue ? "bg-[var(--error)] animate-pulse" : "bg-[var(--primary)]"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                              {issue.title}
                            </p>
                            <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-medium text-[var(--text-tertiary)] shrink-0">
                                {issue.issueId}
                              </span>
                              <span className="text-[var(--text-tertiary)]">•</span>
                              <span className="truncate">
                                {client?.code ?? "—"} / {project?.name ?? "—"}
                              </span>
                              
                              {/* Display active running timer */}
                              {isTickingForThisIssue && (
                                <>
                                  <span className="text-[var(--text-tertiary)]">•</span>
                                  <Badge className="bg-[rgba(34,197,94,0.15)] text-[var(--success)] hover:bg-[rgba(34,197,94,0.2)] text-[9px] font-bold py-0 h-4 border border-[rgba(34,197,94,0.3)] animate-pulse-soft">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse mr-1 inline-block" />
                                    Live: {formatStopwatchTime(elapsedSeconds)}
                                  </Badge>
                                </>
                              )}

                              {/* Display static tracked time if paused */}
                              {!isTickingForThisIssue && elapsedSeconds > 0 && (
                                <>
                                  <span className="text-[var(--text-tertiary)]">•</span>
                                  <Badge className="bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)] text-[9px] font-bold py-0 h-4 border border-[var(--border)]">
                                    Tracked: {formatStopwatchTime(elapsedSeconds)}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant={
                              issue.priority === "Critical"
                                ? "destructive"
                                : issue.priority === "High"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] uppercase tracking-wider font-semibold"
                          >
                            {issue.priority}
                          </Badge>
                          <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline-block">
                            {new Date(issue.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Quick Timer (Stopwatch Engine Widget) */}
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Timer className="h-4.5 w-4.5 text-[var(--primary-text)]" />
                Quick Timer Widget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2">
                <p className="text-4xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
                  {formatStopwatchTime(time)}
                </p>
                {selectedIssueObject ? (
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-1 truncate max-w-full px-2" title={selectedIssueObject.title}>
                    Tracking: <span className="font-mono text-[var(--primary-text)] font-semibold">{selectedIssueObject.issueId}</span>
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    No active task selected
                  </p>
                )}
              </div>

              {/* Task Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Select Issue to Track
                </label>
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  className="w-full text-xs h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60 transition-colors"
                >
                  <option value="">-- Choose active issue --</option>
                  {userActiveIssues.map((issue) => (
                    <option key={issue._id} value={issue._id}>
                      [{issue.issueId}] {issue.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stopwatch Action Controls */}
              <div className="flex gap-2">
                {!isTicking ? (
                  <button
                    onClick={handleStartTimer}
                    disabled={!selectedIssueId}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTimer}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <Pause className="h-3.5 w-3.5 fill-current" />
                    Pause
                  </button>
                )}
                <button
                  onClick={handleStopTimer}
                  disabled={time === 0}
                  className="flex items-center justify-center h-10 w-12 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Reset Timer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Project Hours Progress (Manager View) */}
          {isManager && projects.length > 0 && (
            <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FolderKanban className="h-4.5 w-4.5 text-[var(--primary-text)]" />
                  Project Hours Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.slice(0, 4).map((project) => {
                  const allocated = project.allocatedHours || 0;
                  const used = project.usedHours || 0;
                  const ratio = allocated > 0 ? (used / allocated) * 100 : 0;
                  const percent = Math.min(Math.round(ratio), 100);

                  return (
                    <div key={project._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[var(--text-primary)] truncate max-w-[150px]">
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
                            ? "bg-[var(--error)]"
                            : percent > 75
                            ? "bg-yellow-500"
                            : "bg-[var(--primary)]"
                        }
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Resolution Trend (Live SVG Chart) */}
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-[var(--primary-text)]" />
                7-Day Resolution Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {/* SVG Line Chart */}
              <div className="relative w-full h-32 flex flex-col justify-end">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-[var(--border)] pb-6">
                  <div className="w-full border-t border-[var(--border)] border-dashed" />
                  <div className="w-full border-t border-[var(--border)] border-dashed" />
                </div>
                
                {/* Columns / Bars in SVG */}
                <div className="flex items-end justify-between h-24 px-1.5 z-10">
                  {chartPoints.map((point, idx) => {
                    const heightPercent = (point.count / maxChartCount) * 100;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] px-1.5 py-0.5 rounded absolute -top-1 font-semibold pointer-events-none">
                          {point.count} resolved
                        </div>
                        
                        {/* Bar */}
                        <div
                          className="w-3 sm:w-4 rounded-t-sm bg-gradient-to-t from-[var(--primary)] to-[var(--secondary)] transition-all duration-500 hover:brightness-110"
                          style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        />
                        
                        {/* Day label */}
                        <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-tight">
                          {point.dateStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
