"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Building,
  AlertOctagon,
  PieChart as PieIcon,
  BarChart3,
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
  useGetWeeklyReport,
  useGenerateWeeklyReport,
  useExportReport,
} from "@/api/services/reports/report-service";
import type { WeeklyReportData } from "@/api/services/reports/report-service";
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

export function WeeklyReportView() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  });

  const { data: reportRecord, isLoading, refetch } = useGetWeeklyReport(selectedWeek);
  const generateMutation = useGenerateWeeklyReport();
  const exportMutation = useExportReport();

  const report = reportRecord?.data as WeeklyReportData | undefined;
  const reportId = reportRecord?._id;
  const hasReport = !!report?.issueVolume;

  // Fallbacks to prevent blank pages
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

  const navigateWeek = (weeks: number) => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + weeks * 7);
    setSelectedWeek(d.toISOString().split("T")[0]);
  };

  const handleGenerate = () => {
    generateMutation.mutate(selectedWeek, {
      onSuccess: () => refetch(),
    });
  };

  const formatDisplayWeek = (dateStr: string) => {
    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  };

  // Unified project comparison for Summary tab
  const getUnifiedProjectData = () => {
    const projectMap: Record<string, { project: string; newIssues: number; resolvedIssues: number; newCrs: number; completedCrs: number; newTasks: number; completedTasks: number; billed: number; received: number }> = {};
    
    if (report?.issueVolume?.byProject) {
      report.issueVolume.byProject.forEach((p) => {
        if (!projectMap[p.project]) {
          projectMap[p.project] = { project: p.project, newIssues: 0, resolvedIssues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
        }
        projectMap[p.project].newIssues = p.newIssues;
        projectMap[p.project].resolvedIssues = p.resolved + p.closed;
      });
    }

    changeRequests.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, newIssues: 0, resolvedIssues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newCrs = p.new;
      projectMap[p.project].completedCrs = p.completed;
    });

    tasks.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, newIssues: 0, resolvedIssues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newTasks = p.new;
      projectMap[p.project].completedTasks = p.completed;
    });

    finance.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, newIssues: 0, resolvedIssues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].billed = p.billed;
      projectMap[p.project].received = p.received;
    });

    return Object.values(projectMap);
  };

  if (isLoading) return <ReportSkeleton />;

  // Backlog colors
  const BACKLOG_COLORS = ["#2ecc71", "#3498db", "#f1c40f", "#e74c3c"];

  const backlogChartData = report
    ? [
        { name: "0-3 Days", value: report.backlogHealth.zeroToThreeDays },
        { name: "3-7 Days", value: report.backlogHealth.threeToSevenDays },
        { name: "7-14 Days", value: report.backlogHealth.sevenToFourteenDays },
        { name: ">14 Days", value: report.backlogHealth.overFourteenDays },
      ].filter((d) => d.value > 0)
    : [];

  const unifiedProjects = getUnifiedProjectData();

  // Multi-Bar delivery data
  const weeklyProjectDeliveryData = unifiedProjects.map(p => ({
    name: p.project,
    Issues: p.resolvedIssues,
    CRs: p.completedCrs,
    Tasks: p.completedTasks,
  }));

  // Delivery Share Donut Data
  const totalIssuesResolved = report ? (report.issueVolume.totalResolved + report.issueVolume.totalClosed) : 0;
  const weeklyDeliveryShare = [
    { name: "Issues Resolved", value: totalIssuesResolved, color: "#3498db" },
    { name: "CRs Completed", value: changeRequests.totalCompleted, color: "#9b59b6" },
    { name: "Tasks Completed", value: tasks.totalCompleted, color: "#2ecc71" },
  ].filter(d => d.value > 0);

  // Predictions Helper
  const getWeeklyPredictions = () => {
    if (!report) return null;
    const issuesNext = Math.ceil(report.issueVolume.totalNew * 1.15);
    const crsNext = Math.ceil(changeRequests.totalNew * 1.10);
    const tasksNext = Math.ceil(tasks.totalNew * 1.10);
    
    const backlogTotal = report.backlogHealth.total || 0;
    const weeklyResolved = report.issueVolume.totalResolved + report.issueVolume.totalClosed;
    const weeksToClear = weeklyResolved > 0 ? (backlogTotal / weeklyResolved).toFixed(1) : "∞";

    return {
      issuesNext,
      crsNext,
      tasksNext,
      weeksToClear,
      backlogTotal,
    };
  };

  const predictions = getWeeklyPredictions();

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
              Weekly Operations Summary
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              {formatDisplayWeek(selectedWeek)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => navigateWeek(-1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 text-xs font-medium text-[var(--text-secondary)] min-w-[100px] text-center">
              Week of {selectedWeek}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => navigateWeek(1)}
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
          title="No Weekly Report Yet"
          description={`No report has been compiled for the week of ${formatDisplayWeek(selectedWeek)}. Click Generate to compile now.`}
          action={
            <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate Weekly Report"}
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
                  <CardTitle className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Issues Volume</CardTitle>
                  <Activity className="h-4 w-4 text-[var(--primary)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {report.issueVolume.totalResolved + report.issueVolume.totalClosed + report.issueVolume.totalNew}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {report.issueVolume.totalNew} New / {report.issueVolume.totalResolved} Resolved this week
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
                    {changeRequests.totalNew} New / {changeRequests.totalCompleted} Completed this week
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
                    {tasks.totalNew} Created / {tasks.totalCompleted} Completed this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Predictions Card */}
            {predictions && (
              <Card className="bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-purple-500/5 border-[var(--border)] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                    <CardTitle className="text-xs font-semibold">Weekly Operations Forecast & Predictions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3">
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Forecasted Issues (Next Week)</p>
                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{predictions.issuesNext} <span className="text-xs font-normal text-[var(--text-tertiary)]">incoming</span></p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Based on weekly 15% delta</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Forecasted CRs (Next Week)</p>
                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{predictions.crsNext} <span className="text-xs font-normal text-[var(--text-tertiary)]">completed</span></p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Estimated delivery rate</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Forecasted Tasks (Next Week)</p>
                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{predictions.tasksNext} <span className="text-xs font-normal text-[var(--text-tertiary)]">completed</span></p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Estimated tasks clearing</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Backlog Resolution Pace</p>
                    <p className="text-lg font-bold mt-1 text-emerald-500">{predictions.weeksToClear} <span className="text-xs font-normal text-[var(--text-tertiary)]">weeks</span></p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">To clear current {predictions.backlogTotal} issues</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Project Delivery Multi-Bar Chart */}
              <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Weekly Project Delivery Velocity</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyProjectDeliveryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                       <Bar dataKey="Issues" fill="#3498db" name="Resolved Issues" radius={[3, 3, 0, 0]} />
                       <Bar dataKey="CRs" fill="#9b59b6" name="Completed CRs" radius={[3, 3, 0, 0]} />
                       <Bar dataKey="Tasks" fill="#2ecc71" name="Completed Tasks" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Delivery Share Donut */}
              <Card className="lg:col-span-1 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Weekly Delivery Share</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] flex flex-col justify-between pb-4">
                  <div className="h-[180px] w-full">
                    {weeklyDeliveryShare.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                        No delivery items this week
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={weeklyDeliveryShare}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {weeklyDeliveryShare.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] items-center">
                    <div className="flex gap-3">
                      {weeklyDeliveryShare.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[var(--text-secondary)] font-normal">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unified weekly project summary */}
              <Card className="lg:col-span-3 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Weekly Project-wise Delivery Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {unifiedProjects.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">No weekly activities logged.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                            <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">Issues (New/Resolved)</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">CRs (New/Completed)</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">Tasks (New/Completed)</th>
                            <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Total Billed</th>
                            <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {unifiedProjects.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="p-3 font-medium">{row.project}</td>
                              <td className="p-3 text-center font-mono">
                                <span className={row.newIssues > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>{row.newIssues}</span>
                                <span className="text-[var(--text-tertiary)]">/</span>
                                <span className={row.resolvedIssues > 0 ? "text-emerald-500 font-semibold" : "text-[var(--text-tertiary)]"}>{row.resolvedIssues}</span>
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span className={row.newCrs > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>{row.newCrs}</span>
                                <span className="text-[var(--text-tertiary)]">/</span>
                                <span className={row.completedCrs > 0 ? "text-purple-500 font-semibold" : "text-[var(--text-tertiary)]"}>{row.completedCrs}</span>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="SLA Compliance Rate"
                value={`${report.slaCompliance.rate}%`}
                trend={report.slaCompliance.rate >= report.slaCompliance.priorWeekRate ? "up" : "down"}
                trendValue={`${Math.abs(report.slaCompliance.rate - report.slaCompliance.priorWeekRate)}% WoW`}
                variant={report.slaCompliance.rate >= 90 ? "success" : report.slaCompliance.rate >= 75 ? "warning" : "danger"}
                icon={<ShieldAlert className="h-4 w-4" />}
              />
              <StatCard
                label="Avg Resolution Time"
                value={`${report.resolutionTime.avgHours} hrs`}
                subtitle={`Median: ${report.resolutionTime.medianHours} hrs | P95: ${report.resolutionTime.p95Hours} hrs`}
                icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
              />
              <StatCard
                label="Total Issues Handled"
                value={report.issueVolume.totalResolved + report.issueVolume.totalClosed + report.issueVolume.totalNew}
                subtitle={`${report.issueVolume.totalNew} New / ${report.issueVolume.totalResolved} Resolved`}
                icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
              />
              <StatCard
                label="Escalations Count"
                value={report.escalationCount.total}
                variant={report.escalationCount.total > 0 ? "danger" : "success"}
                icon={<AlertOctagon className="h-4 w-4 text-red-500" />}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Issue Volume Chart */}
              <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Issue Volume by Project</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.issueVolume.byProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="project" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                       <Bar dataKey="newIssues" name="New" fill="#f39c12" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="resolved" name="Resolved" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="closed" name="Closed" fill="#7f8c8d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Backlog Health Pie */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-[var(--primary)]" />
                    Backlog Age Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-[280px] pb-4">
                  <div className="h-[180px] w-full">
                    {backlogChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                        No issues in backlog
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={backlogChartData}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {backlogChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={BACKLOG_COLORS[index % BACKLOG_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[0] }} />
                      <span className="text-[var(--text-secondary)] font-normal">0-3 days ({report.backlogHealth.zeroToThreeDays})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[1] }} />
                      <span className="text-[var(--text-secondary)] font-normal">3-7 days ({report.backlogHealth.threeToSevenDays})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[2] }} />
                      <span className="text-[var(--text-secondary)] font-normal">7-14 days ({report.backlogHealth.sevenToFourteenDays})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[3] }} />
                      <span className="text-[var(--text-secondary)] font-normal">&gt;14 days ({report.backlogHealth.overFourteenDays})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Hours Allocation & Developer Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Project Hours Table */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4 text-[var(--primary)]" />
                    Project Support Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Project</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Allocated</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Used</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Remaining</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.projectHours.map((p, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-4 text-sm font-medium">{p.project}</td>
                            <td className="p-4 text-sm text-right font-mono">{p.allocated}h</td>
                            <td className="p-4 text-sm text-right font-mono">{p.used}h</td>
                            <td className="p-4 text-sm text-right font-mono font-semibold" style={{ color: p.remaining < 0 ? "var(--destructive)" : "inherit" }}>
                              {p.remaining}h
                            </td>
                            <td className="p-4 text-sm text-right">
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium">
                                {p.trend === "up" ? (
                                  <span className="text-red-500 flex items-center"><ArrowUpRight className="h-3 w-3" /> Inc</span>
                                ) : p.trend === "down" ? (
                                  <span className="text-emerald-500 flex items-center"><ArrowDownRight className="h-3 w-3" /> Dec</span>
                                ) : (
                                  <span className="text-[var(--text-tertiary)]">Flat</span>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Developer Workload & Velocity */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[var(--primary)]" />
                    Engineer Velocity & Workload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Engineer</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Hours Logged</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Issues Handled</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Avg Handle Time</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Active Velocity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.memberWorkload.map((m, i) => {
                          const velocity = report.developerVelocity.find((v) => v.name === m.name);
                          return (
                            <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="p-4 text-sm font-medium">{m.name}</td>
                              <td className="p-4 text-sm text-right font-mono">{m.hoursLogged}h</td>
                              <td className="p-4 text-sm text-right font-mono">{m.issuesHandled}</td>
                              <td className="p-4 text-sm text-right font-mono">{m.avgResolutionHours}h</td>
                              <td className="p-4 text-sm text-right font-mono font-medium text-[var(--primary-text)]">
                                {velocity ? `${velocity.avgInProgressToResolved}h` : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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

            {/* CR Breakdowns */}
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged this week.</p>
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged this week.</p>
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged this week.</p>
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged this week.</p>
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
                    <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No finance records logged this week.</p>
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
