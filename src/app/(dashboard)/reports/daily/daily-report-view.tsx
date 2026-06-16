"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  GitPullRequest,
  CheckSquare,
  Wallet,
  Activity,
  TrendingUp,
  DollarSign,
  AlertCircle
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components";
import { StatCard } from "../components/stat-card";
import { EmptyReport } from "../components/empty-report";
import { ReportSkeleton } from "../components/report-skeleton";
import { ExportDropdown } from "../components/export-dropdown";
import {
  useGetDailyReport,
  useGenerateDailyReport,
  useExportReport,
} from "@/api/services/reports/report-service";
import type { DailyReportData } from "@/api/services/reports/report-service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function DailyReportView() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  const { data: reportRecord, isLoading, refetch } = useGetDailyReport(selectedDate);
  const generateMutation = useGenerateDailyReport();
  const exportMutation = useExportReport();

  const report = reportRecord?.data as DailyReportData | undefined;
  const reportId = reportRecord?._id;
  const hasReport = !!report?.issuesSummary;

  // Fallbacks to prevent conditional blank screens
  const changeRequests = report?.changeRequests || {
    totalNew: 0,
    totalCompleted: 0,
    totalCount: 0,
    totalEstimatedHours: 0,
    totalActualHours: 0,
    totalEstimatedCost: 0,
    statusBreakdown: {
      "New": 0,
      "Estimation": 0,
      "Approved": 0,
      "In Progress": 0,
      "QA/Testing": 0,
      "Completed": 0,
      "Cancelled": 0
    },
    priorityBreakdown: {
      "Low": 0,
      "Medium": 0,
      "High": 0,
      "Critical": 0
    },
    byProject: [],
  };

  const tasks = report?.tasks || {
    totalNew: 0,
    totalCompleted: 0,
    totalCount: 0,
    statusBreakdown: {
      "To Do": 0,
      "In Progress": 0,
      "Done": 0
    },
    priorityBreakdown: {
      "Low": 0,
      "Medium": 0,
      "High": 0,
      "Critical": 0
    },
    byProject: [],
  };

  const finance = report?.finance || {
    totalBilled: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    totalPartiallyPaid: 0,
    statusBreakdown: {
      "Paid": 0,
      "Pending": 0,
      "Partially Paid": 0,
      "Overdue": 0
    },
    byProject: [],
  };

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleGenerate = () => {
    generateMutation.mutate(selectedDate, {
      onSuccess: () => refetch(),
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Unified project comparison for Summary tab
  const getUnifiedProjectData = () => {
    const projectMap: Record<string, { project: string; newCrs: number; completedCrs: number; newTasks: number; completedTasks: number; billed: number; received: number }> = {};
    
    changeRequests.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newCrs = p.new;
      projectMap[p.project].completedCrs = p.completed;
    });

    tasks.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newTasks = p.new;
      projectMap[p.project].completedTasks = p.completed;
    });

    finance.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].billed = p.billed;
      projectMap[p.project].received = p.received;
    });

    return Object.values(projectMap);
  };

  if (isLoading) return <ReportSkeleton />;

  const dailyComparisonData = report
    ? [
        {
          name: "Issues",
          Created: report.issuesSummary.newToday,
          Completed: report.issuesSummary.resolvedToday,
        },
        {
          name: "CRs",
          Created: changeRequests.totalNew,
          Completed: changeRequests.totalCompleted,
        },
        {
          name: "Tasks",
          Created: tasks.totalNew,
          Completed: tasks.totalCompleted,
        },
      ]
    : [];

  const unifiedProjects = getUnifiedProjectData();

  // Active items workload mix calculation
  const activeIssues = report ? (report.issuesSummary.total - report.issuesSummary.resolvedToday - report.issuesSummary.closedToday) : 0;
  const activeCrs = changeRequests.totalCount - changeRequests.totalCompleted;
  const activeTasksCount = tasks.totalCount - tasks.totalCompleted;

  const activeShareData = [
    { name: "Issues", value: Math.max(0, activeIssues), color: "#3498db" },
    { name: "CRs", value: Math.max(0, activeCrs), color: "#9b59b6" },
    { name: "Tasks", value: Math.max(0, activeTasksCount), color: "#2ecc71" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <Calendar className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Daily Operations Report
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 text-xs font-medium text-[var(--text-secondary)] min-w-[100px] text-center">
              {selectedDate}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => navigateDate(1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            Generate
          </Button>

          {hasReport && reportId && (
            <ExportDropdown
              onExportPdf={() => exportMutation.mutate({ reportId, format: "pdf" })}
              onExportExcel={() => exportMutation.mutate({ reportId, format: "excel" })}
              isLoading={exportMutation.isPending}
            />
          )}
        </div>
      </div>

      {!hasReport ? (
        <EmptyReport
          title="No Daily Report Yet"
          description={`No report has been generated for ${formatDisplayDate(selectedDate)}. Click Generate to create one now.`}
          action={
            <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate Daily Report"}
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="summary" className="w-full space-y-6">
          <TabsList className="bg-[var(--background)] border border-[var(--border)] w-full sm:w-auto flex flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="summary" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="issues" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="crs" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5" />
              CRs
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="finance" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Finance
            </TabsTrigger>
          </TabsList>

          {/* 1. Summary Tab */}
          <TabsContent value="summary" className="space-y-6 outline-none">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Issues Handled</CardTitle>
                  <Activity className="h-4 w-4 text-[var(--primary)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {report.issuesSummary.total}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {report.issuesSummary.newToday} New / {report.issuesSummary.resolvedToday} Resolved
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Change Requests</CardTitle>
                  <GitPullRequest className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {changeRequests.totalCount}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {changeRequests.totalNew} New / {changeRequests.totalCompleted} Completed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Tasks Tracked</CardTitle>
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {tasks.totalCount}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {tasks.totalNew} Created / {tasks.totalCompleted} Completed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Charts & Unified Project Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity comparison chart */}
              <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">Today's Activity Comparison</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Created" fill="#e67e22" name="Created/New" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Completed" fill="#2ecc71" name="Completed/Resolved" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Active Delivery Share Pie Donut */}
              <Card className="lg:col-span-1 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">Active Delivery Share</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] flex flex-col justify-between pb-4">
                  <div className="h-[180px] w-full">
                    {activeShareData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                        No active items today
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activeShareData}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {activeShareData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 text-xs">
                    {activeShareData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[var(--text-secondary)] font-normal">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Unified project table */}
              <Card className="lg:col-span-3 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">Today's Project-wise Delivery Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {unifiedProjects.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">No project activities recorded today.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                            <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">CRs (New/Comp)</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">Tasks (New/Comp)</th>
                            <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Revenue Billed</th>
                            <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Revenue Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {unifiedProjects.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="p-3 font-medium">{row.project}</td>
                              <td className="p-3 text-center font-mono">
                                <span className={row.newCrs > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>{row.newCrs}</span>
                                <span className="text-[var(--text-tertiary)]">/</span>
                                <span className={row.completedCrs > 0 ? "text-emerald-500 font-semibold" : "text-[var(--text-tertiary)]"}>{row.completedCrs}</span>
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span className={row.newTasks > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>{row.newTasks}</span>
                                <span className="text-[var(--text-tertiary)]">/</span>
                                <span className={row.completedTasks > 0 ? "text-blue-500 font-semibold" : "text-[var(--text-tertiary)]"}>{row.completedTasks}</span>
                              </td>
                              <td className="p-3 text-right font-mono text-[var(--text-secondary)]">
                                {row.billed > 0 ? `Rs. ${row.billed.toLocaleString()}` : "—"}
                              </td>
                              <td className="p-3 text-right font-mono text-emerald-500 font-semibold">
                                {row.received > 0 ? `Rs. ${row.received.toLocaleString()}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2. Issues Tab */}
          <TabsContent value="issues" className="space-y-6 outline-none">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard
                label="New Today"
                value={report.issuesSummary.newToday}
                icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
              />
              <StatCard
                label="In Progress"
                value={report.issuesSummary.inProgress}
                icon={<RefreshCw className="h-4 w-4 text-blue-500" />}
                variant="default"
              />
              <StatCard
                label="Resolved"
                value={report.issuesSummary.resolvedToday}
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                variant="success"
              />
              <StatCard
                label="SLA Compliance"
                value={`${report.slaStatus.complianceRate}%`}
                subtitle={`${report.slaStatus.breachedToday} breached`}
                variant={report.slaStatus.complianceRate >= 90 ? "success" : report.slaStatus.complianceRate >= 75 ? "warning" : "danger"}
                icon={<ShieldAlert className="h-4 w-4 text-amber-500" />}
              />
              <StatCard
                label="Reopened"
                value={report.issuesSummary.reopened}
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                variant={report.issuesSummary.reopened > 0 ? "danger" : "default"}
              />
            </div>

            {/* SLA Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Within SLA</p>
                  <p className="text-2xl font-bold text-emerald-500">{report.slaStatus.withinSla}</p>
                </CardContent>
              </Card>
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Breached Today</p>
                  <p className="text-2xl font-bold text-red-500">{report.slaStatus.breachedToday}</p>
                </CardContent>
              </Card>
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">At Risk</p>
                  <p className="text-2xl font-bold text-amber-500">{report.slaStatus.atRisk}</p>
                </CardContent>
              </Card>
            </div>

            {/* Member Activity Table */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--primary-text)]" />
                  Member Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                        <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Name</th>
                        <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Hours Logged</th>
                        <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Issues Touched</th>
                        <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {report.memberActivity.map((m, i) => (
                        <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="p-4 text-sm font-medium">{m.name}</td>
                          <td className="p-4 text-sm text-right font-mono">{m.hoursLogged}h</td>
                          <td className="p-4 text-sm text-right font-mono">{m.issuesTouched}</td>
                          <td className="p-4 text-sm text-right">
                            <Badge variant="secondary" className="text-xs">{m.issuesResolved}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Critical & Pending */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Critical Unassigned */}
              <Card className="bg-[var(--surface)] border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    Critical Unassigned ({report.criticalUnassigned.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.criticalUnassigned.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                      No critical unassigned issues ✓
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {report.criticalUnassigned.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <div>
                            <p className="text-xs font-mono text-red-500">{item.issueId}</p>
                            <p className="text-sm text-[var(--text-primary)]">{item.title}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs shrink-0">{item.age}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Client */}
              <Card className="bg-[var(--surface)] border-amber-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                    <Clock className="h-4 w-4" />
                    Pending Client Response ({report.pendingClient.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.pendingClient.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                      No pending client responses ✓
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {report.pendingClient.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <div>
                            <p className="text-xs font-mono text-amber-600">{item.issueId}</p>
                            <p className="text-sm text-[var(--text-primary)]">{item.title}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{item.client}</p>
                          </div>
                          <Badge className="bg-amber-500/10 text-amber-600 text-xs shrink-0">
                            {item.pendingSince}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 3. CRs Tab */}
          <TabsContent value="crs" className="space-y-6 outline-none">
            {/* CR Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Total Active CRs"
                value={changeRequests.totalCount}
                subtitle={`${changeRequests.totalNew} New / ${changeRequests.totalCompleted} Completed`}
                icon={<GitPullRequest className="h-4 w-4 text-purple-500" />}
              />
              <StatCard
                label="Est. Development Time"
                value={`${changeRequests.totalEstimatedHours}h`}
                icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
              />
              <StatCard
                label="Actual Hours Spent"
                value={`${changeRequests.totalActualHours}h`}
                variant={changeRequests.totalActualHours > changeRequests.totalEstimatedHours ? "warning" : "default"}
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatCard
                label="Estimated CR Value"
                value={`Rs. ${changeRequests.totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                variant="success"
                icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
              />
            </div>

            {/* CR Breakdown Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">CR Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(changeRequests.statusBreakdown).map(([status, count]) => {
                      if (count === 0) return null;
                      return (
                        <Badge key={status} variant="outline" className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-[var(--background)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                          <span className="font-semibold">{status}:</span> {count}
                        </Badge>
                      );
                    })}
                    {Object.values(changeRequests.statusBreakdown).every(v => v === 0) && (
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged today.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">CR Priority Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(changeRequests.priorityBreakdown).map(([priority, count]) => {
                      if (count === 0) return null;
                      let color = "bg-blue-500";
                      if (priority === "Critical") color = "bg-red-500";
                      if (priority === "High") color = "bg-orange-500";
                      if (priority === "Low") color = "bg-gray-400";
                      return (
                        <Badge key={priority} variant="outline" className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-[var(--background)]">
                          <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                          <span className="font-semibold">{priority}:</span> {count}
                        </Badge>
                      );
                    })}
                    {Object.values(changeRequests.priorityBreakdown).every(v => v === 0) && (
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged today.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Table */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">CR Count by Project</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {changeRequests.byProject.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">No CRs found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">New CRs</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Completed CRs</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Total Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {changeRequests.byProject.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-3 font-medium">{row.project}</td>
                            <td className="p-3 text-right font-mono">{row.new}</td>
                            <td className="p-3 text-right font-mono text-emerald-500 font-semibold">{row.completed}</td>
                            <td className="p-3 text-right font-mono font-semibold">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6 outline-none">
            {/* Task Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard
                label="Total Active Tasks"
                value={tasks.totalCount}
                subtitle={`${tasks.totalNew} Created / ${tasks.totalCompleted} Completed`}
                icon={<CheckSquare className="h-4 w-4 text-blue-500" />}
              />
              <StatCard
                label="Tasks Completed"
                value={tasks.totalCompleted}
                variant="success"
                icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              />
              <StatCard
                label="Tasks In Progress"
                value={tasks.statusBreakdown["In Progress"] || 0}
                icon={<Clock className="h-4 w-4 text-amber-500" />}
              />
            </div>

            {/* Task breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">Task Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tasks.statusBreakdown).map(([status, count]) => {
                      if (count === 0) return null;
                      return (
                        <Badge key={status} variant="outline" className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-[var(--background)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span className="font-semibold">{status}:</span> {count}
                        </Badge>
                      );
                    })}
                    {Object.values(tasks.statusBreakdown).every(v => v === 0) && (
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged today.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">Task Priority Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tasks.priorityBreakdown).map(([priority, count]) => {
                      if (count === 0) return null;
                      let color = "bg-blue-500";
                      if (priority === "Critical") color = "bg-red-500";
                      if (priority === "High") color = "bg-orange-500";
                      if (priority === "Low") color = "bg-gray-400";
                      return (
                        <Badge key={priority} variant="outline" className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-[var(--background)]">
                          <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                          <span className="font-semibold">{priority}:</span> {count}
                        </Badge>
                      );
                    })}
                    {Object.values(tasks.priorityBreakdown).every(v => v === 0) && (
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged today.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Table */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Task Activity by Project</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {tasks.byProject.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">No tasks found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">New Tasks</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Completed Tasks</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Total Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {tasks.byProject.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-3 font-medium">{row.project}</td>
                            <td className="p-3 text-right font-mono">{row.new}</td>
                            <td className="p-3 text-right font-mono text-emerald-500 font-semibold">{row.completed}</td>
                            <td className="p-3 text-right font-mono font-semibold">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Finance Tab */}
          <TabsContent value="finance" className="space-y-6 outline-none">
            {/* Financial Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard
                label="Total Billed"
                value={`Rs. ${finance.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<Wallet className="h-4 w-4 text-purple-500" />}
              />
              <StatCard
                label="Total Received"
                value={`Rs. ${finance.totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                variant="success"
                icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              />
              <StatCard
                label="Total Outstanding"
                value={`Rs. ${finance.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                variant={finance.totalOutstanding > 0 ? "danger" : "success"}
                icon={<AlertCircle className={`h-4 w-4 ${finance.totalOutstanding > 0 ? "text-red-500" : "text-emerald-500"}`} />}
              />
            </div>

            {/* Payment status pills */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Payment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(finance.statusBreakdown).map(([status, count]) => {
                    if (count === 0) return null;
                    let color = "bg-blue-500";
                    if (status === "Paid") color = "bg-emerald-500";
                    if (status === "Overdue") color = "bg-red-500";
                    if (status === "Pending") color = "bg-amber-500";
                    return (
                      <Badge key={status} variant="outline" className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-[var(--background)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                        <span className="font-semibold">{status}:</span> {count}
                      </Badge>
                    );
                  })}
                  {Object.values(finance.statusBreakdown).every(v => v === 0) && (
                    <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No finance records logged today.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Table */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Billing by Project</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {finance.byProject.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">No billing records found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Total Billed</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Received</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {finance.byProject.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-3 font-medium">{row.project}</td>
                            <td className="p-3 text-right font-mono">Rs. {row.billed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-emerald-500 font-semibold">Rs. {row.received.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className={`p-3 text-right font-mono font-semibold ${row.outstanding > 0 ? "text-red-500" : ""}`}>
                              Rs. {row.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
