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
  UserCheck,
  UserX,
} from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatCard } from "@/components/atoms/statCard";
import { TimesheetApprovalView } from "@/app/(dashboard)/reports/timesheet-approval/timesheet-approval-view";
import { useGetProjectsMonthlyUsage } from "@/api/services/project-management/project-service";
import { Progress } from "@/components/ui/progress";
import { useGetAllTasks } from "@/api/services/project-management/task-service";
import { useGetAllCRs } from "@/api/services/project-management/cr-service";
import { useUpdateIssue } from "@/api/services/issue-management/issue-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();
  const updateIssueMutation = useUpdateIssue();

  // Fetch all tasks & CRs
  const { data: allTasksData, refetch: refetchAllTasks } = useGetAllTasks();
  const { data: allCRsData, refetch: refetchAllCRs } = useGetAllCRs();

  const allTasks = useMemo(() => allTasksData ?? [], [allTasksData]);
  const allCRs = useMemo(() => allCRsData ?? [], [allCRsData]);

  // Task & CR Update Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async ({ projectId, taskId, data }: { projectId: string; taskId: string; data: any }) => {
      const res = await axiosInstance.patch(`/projects/${projectId}/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/tasks/all"] });
      refetchAllTasks();
    }
  });

  const updateCRMutation = useMutation({
    mutationFn: async ({ projectId, crId, data }: { projectId: string; crId: string; data: any }) => {
      const res = await axiosInstance.patch(`/projects/${projectId}/crs/${crId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/crs/all"] });
      refetchAllCRs();
    }
  });

  // Filter pending re-assignment requests
  const pendingReassignments = useMemo(() => {
    const list: Array<{
      id: string;
      type: "issue" | "task" | "cr";
      title: string;
      code: string;
      projectId?: string;
      requestedBy: any;
      requestedTo: any;
      reason: string;
      requestedAt: string;
    }> = [];

    // Filter Issues
    issues.forEach((i) => {
      if (i.reassignRequest && i.reassignRequest.status === "Pending") {
        list.push({
          id: i._id,
          type: "issue",
          title: i.title,
          code: i.issueId,
          requestedBy: i.reassignRequest.requestedBy,
          requestedTo: i.reassignRequest.requestedTo,
          reason: i.reassignRequest.reason || "No reason provided",
          requestedAt: i.reassignRequest.requestedAt || "",
        });
      }
    });

    // Filter Tasks
    allTasks.forEach((t) => {
      if (t.reassignRequest && t.reassignRequest.status === "Pending") {
        const projId = typeof t.project === "object" && t.project ? (t.project as any)._id : t.project;
        list.push({
          id: t._id,
          type: "task",
          title: t.name,
          code: "Task",
          projectId: projId,
          requestedBy: t.reassignRequest.requestedBy,
          requestedTo: t.reassignRequest.requestedTo,
          reason: t.reassignRequest.reason || "No reason provided",
          requestedAt: t.reassignRequest.requestedAt || "",
        });
      }
    });

    // Filter CRs
    allCRs.forEach((c) => {
      if (c.reassignRequest && c.reassignRequest.status === "Pending") {
        const projId = typeof c.project === "object" && c.project ? (c.project as any)._id : c.project;
        list.push({
          id: c._id,
          type: "cr",
          title: c.title,
          code: c.crNumber || "CR",
          projectId: projId,
          requestedBy: c.reassignRequest.requestedBy,
          requestedTo: c.reassignRequest.requestedTo,
          reason: c.reassignRequest.reason || "No reason provided",
          requestedAt: c.reassignRequest.requestedAt || "",
        });
      }
    });

    return list;
  }, [issues, allTasks, allCRs]);

  // Handle Approve/Decline
  const handleApproveReassignment = async (item: any) => {
    const targetUserId = typeof item.requestedTo === "object" && item.requestedTo ? item.requestedTo._id : item.requestedTo;
    
    const data = {
      reassignRequest: null, // clear request block
    };

    try {
      if (item.type === "issue") {
        await updateIssueMutation.mutateAsync({
          id: item.id,
          data: {
            ...data,
            assignedTo: targetUserId || null,
          },
        });
        toast.success("Issue re-assignment approved and updated.");
        queryClient.invalidateQueries({ queryKey: ["/issues"] });
      } else if (item.type === "task") {
        await updateTaskMutation.mutateAsync({
          projectId: item.projectId!,
          taskId: item.id,
          data: {
            ...data,
            assignees: targetUserId ? [targetUserId] : [],
          },
        });
        toast.success("Task re-assignment approved and updated.");
      } else if (item.type === "cr") {
        await updateCRMutation.mutateAsync({
          projectId: item.projectId!,
          crId: item.id,
          data: {
            ...data,
            assignedDevelopers: targetUserId ? [targetUserId] : [],
          },
        });
        toast.success("CR re-assignment approved and updated.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve re-assignment.");
    }
  };

  const handleDeclineReassignment = async (item: any) => {
    const targetUserId = typeof item.requestedTo === "object" && item.requestedTo ? item.requestedTo._id : item.requestedTo;
    const requestedByUserId = typeof item.requestedBy === "object" && item.requestedBy ? item.requestedBy._id : item.requestedBy;

    const data = {
      reassignRequest: {
        requestedTo: targetUserId || null,
        reason: item.reason,
        requestedBy: requestedByUserId || null,
        status: 'Rejected',
        requestedAt: item.requestedAt || new Date().toISOString()
      }
    };

    try {
      if (item.type === "issue") {
        await updateIssueMutation.mutateAsync({
          id: item.id,
          data,
        });
        toast.success("Issue re-assignment request declined.");
        queryClient.invalidateQueries({ queryKey: ["/issues"] });
      } else if (item.type === "task") {
        await updateTaskMutation.mutateAsync({
          projectId: item.projectId!,
          taskId: item.id,
          data,
        });
        toast.success("Task re-assignment request declined.");
      } else if (item.type === "cr") {
        await updateCRMutation.mutateAsync({
          projectId: item.projectId!,
          crId: item.id,
          data,
        });
        toast.success("CR re-assignment request declined.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to decline re-assignment.");
    }
  };

  // Compute default date range (last 30 days) and current month string YYYY-MM
  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      currentMonthStr: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`
    };
  }, []);

  // Fetch monthly usage of all projects for the current month
  const { data: monthlyUsageData } = useGetProjectsMonthlyUsage(defaultDates.currentMonthStr);

  const monthlyUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (monthlyUsageData) {
      monthlyUsageData.forEach((item) => {
        map[item.projectId] = item.monthlyUsedHours;
      });
    }
    return map;
  }, [monthlyUsageData]);

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
    "To Do": "#64748b",
    Backlog: "#9ca3af",
    Assigned: "#3b82f6",
    "Planned Solution": "#8b5cf6",
    "In Progress": "#f59e0b",
    Review: "#6366f1",
    Testing: "#06b6d4",
    Done: "#10b981",
    "On Hold": "#ef4444",
    "Pending Client": "#f97316",
    Resolved: "#22c55e",
    Closed: "#6b7280",
    Reopened: "#ec4899",
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
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={TrendingUp}
          label="SLA Compliance"
          value={`${metrics.slaComplianceRate}%`}
          trend="Target: 95%+"
          className="hover:scale-[1.01] transition-transform duration-200"
        />
        <StatCard
          icon={AlertTriangle}
          label="SLA At Risk"
          value={metrics.slaAtRisk}
          trend={metrics.slaAtRisk > 0 ? `${metrics.slaAtRisk} overdue` : "Compliant"}
          className={`hover:scale-[1.01] transition-transform duration-200 ${
            metrics.slaAtRisk > 0 ? "border-[var(--destructive)] bg-[rgba(239,68,68,0.02)]" : ""
          }`}
        />
        <StatCard
          icon={Users}
          label="Active Staff Members"
          value={metrics.activeUsers}
          trend={`${users.length} total users`}
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
                const isSupport = project.projectType && project.projectType.includes('Support');
                const monthlyUsed = isSupport ? (monthlyUsageMap[project._id] || 0) : 0;
                const actualRatio = allocated > 0 ? (monthlyUsed / allocated) * 100 : 0;
                const percent = Math.min(Math.round(actualRatio), 100);

                return (
                  <div key={project._id} className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2 text-xs font-semibold">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[var(--text-primary)] truncate font-semibold">
                          {project.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className={`text-[8px] py-0 px-1 font-bold ${
                            isSupport 
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" 
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                          }`}>
                            {isSupport ? "Support" : "Development"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        {isSupport ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[var(--text-secondary)] font-mono whitespace-nowrap">
                              {monthlyUsed.toFixed(1)}/{allocated}h this month
                            </span>
                            {monthlyUsed > allocated && (
                              <Badge variant="destructive" className="text-[8px] scale-90 origin-right py-0 px-1 font-bold">
                                Exceeded
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-mono whitespace-nowrap">
                            {used.toFixed(1)}h used
                          </span>
                        )}
                      </div>
                    </div>
                    {isSupport && (
                      <Progress
                        value={percent}
                        indicatorClassName={
                          actualRatio > 100
                            ? "bg-[var(--destructive)]"
                            : actualRatio > 80
                            ? "bg-amber-500"
                            : "bg-[var(--primary)]"
                        }
                      />
                    )}
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

      {/* Row 3: Pending Re-assignments */}
      {pendingReassignments.length > 0 && (
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-[var(--primary-text)]" />
              Pending Re-assignments ({pendingReassignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReassignments.map((item) => {
                const requestedByName = typeof item.requestedBy === "object" && item.requestedBy ? item.requestedBy.name : "N/A";
                const requestedToName = typeof item.requestedTo === "object" && item.requestedTo ? item.requestedTo.name : (item.requestedTo ? item.requestedTo : "Anyone");
                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`text-[9px] uppercase tracking-wide py-0.5 ${
                            item.type === "issue"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : item.type === "task"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                          }`}
                        >
                          {item.type}
                        </Badge>
                        <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">
                          {item.code}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          Requested: <span className="font-semibold text-[var(--text-primary)]">{requestedByName}</span> → <span className="font-semibold text-[var(--text-primary)]">{requestedToName}</span>
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-hover)]/30 p-2.5 rounded-lg border border-[var(--border)]/50 italic leading-relaxed">
                        Reason: {item.reason}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 md:self-center">
                      <Button
                        size="sm"
                        onClick={() => handleApproveReassignment(item)}
                        disabled={updateIssueMutation.isPending || updateTaskMutation.isPending || updateCRMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineReassignment(item)}
                        disabled={updateIssueMutation.isPending || updateTaskMutation.isPending || updateCRMutation.isPending}
                        className="text-xs h-9 px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-semibold flex items-center gap-1.5"
                      >
                        <UserX className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 4: Timesheet Approval Queue */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-[var(--primary-text)]" />
            Timesheet Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimesheetApprovalView
            startDate={defaultDates.startDate}
            endDate={defaultDates.endDate}
            isManagerOrAdmin={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
