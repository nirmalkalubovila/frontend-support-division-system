"use client";

import { useState } from "react";
import {
  Calendar,
  RefreshCw,
  Clock,
  ShieldAlert,
  Users,
  Building2,
  AlertOctagon,
  Percent,
  CheckCircle2,
  ChevronDown,
  Activity,
  FileSpreadsheet,
  GitPullRequest,
  CheckSquare,
  Wallet,
  Activity as SummaryIcon,
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
  useGetMonthlyReport,
  useGenerateMonthlyReport,
  useExportReport,
} from "@/api/services/reports/report-service";
import type { MonthlyReportData } from "@/api/services/reports/report-service";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function MonthlyReportView() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: reportRecord, isLoading, refetch } = useGetMonthlyReport(selectedMonth, selectedYear);
  const generateMutation = useGenerateMonthlyReport();
  const exportMutation = useExportReport();

  const report = reportRecord?.data as MonthlyReportData | undefined;
  const reportId = reportRecord?._id;
  const hasReport = !!report?.kpiScorecard;

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

  const handleGenerate = () => {
    generateMutation.mutate(
      { month: selectedMonth, year: selectedYear },
      { onSuccess: () => refetch() }
    );
  };

  const getMonthName = (m: number) => {
    const date = new Date(2000, m - 1, 1);
    return date.toLocaleString("en-US", { month: "long" });
  };

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Recharts colors
  const COLORS = [
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#ec4899",
    "#f1c40f",
    "#e74c3c",
  ];

  const issueTypeChartData = report
    ? report.issueTypeAnalysis.map((item) => ({
        name: item.type,
        value: item.count,
      }))
    : [];

  const getUnifiedProjectData = () => {
    const projectMap: Record<string, { project: string; issues: number; newCrs: number; completedCrs: number; newTasks: number; completedTasks: number; billed: number; received: number }> = {};
    
    if (report?.projectPerformance) {
      report.projectPerformance.forEach((p) => {
        if (!projectMap[p.project]) {
          projectMap[p.project] = { project: p.project, issues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
        }
        projectMap[p.project].issues = p.issuesCount;
      });
    }

    changeRequests.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, issues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newCrs = p.new;
      projectMap[p.project].completedCrs = p.completed;
    });

    tasks.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, issues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newTasks = p.new;
      projectMap[p.project].completedTasks = p.completed;
    });

    finance.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, issues: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].billed = p.billed;
      projectMap[p.project].received = p.received;
    });

    return Object.values(projectMap);
  };

  if (isLoading) return <ReportSkeleton />;

  const unifiedProjects = getUnifiedProjectData();

  // Composed Dual-Axis data mapping
  const monthlyProjectDeliveryFinanceData = unifiedProjects.map(p => ({
    name: p.project,
    Issues: p.issues,
    CRs: p.completedCrs,
    Tasks: p.completedTasks,
    Billed: p.billed,
  }));

  // Monthly Delivery Share
  const monthlyDeliveryShare = [
    { name: "Issues Resolved", value: report ? (report.kpiScorecard.totalIssues - report.kpiScorecard.totalOverruns) : 0, color: "#3498db" },
    { name: "CRs Completed", value: changeRequests.totalCompleted, color: "#9b59b6" },
    { name: "Tasks Completed", value: tasks.totalCompleted, color: "#2ecc71" },
  ].filter(d => d.value > 0);

  // Predictions helper
  const getMonthlyPredictions = () => {
    if (!report) return null;
    const issuesNext = Math.ceil(report.kpiScorecard.totalIssues * 1.05);
    const crsNext = Math.ceil((changeRequests.totalCount) * 1.08);
    const tasksNext = Math.ceil((tasks.totalCount) * 1.10);
    
    const projectedCollection = finance.totalReceived + (finance.totalOutstanding * 0.75);

    const projectedHours = report.capacityPlanning.projectedHoursNextMonth || 0;
    const capacity = report.capacityPlanning.currentCapacity || 1;
    const loadFactor = ((projectedHours / capacity) * 100).toFixed(0);

    return {
      issuesNext,
      crsNext,
      tasksNext,
      projectedCollection,
      loadFactor,
      projectedHours,
      capacity,
    };
  };

  const predictions = getMonthlyPredictions();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header / Filter Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <Calendar className="h-5 w-5 text-[var(--primary-text)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Monthly Executive Dashboard
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              {getMonthName(selectedMonth)} {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none h-9 pl-3 pr-8 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 pointer-events-none opacity-60 text-[var(--text-secondary)]" />
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none h-9 pl-3 pr-8 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 pointer-events-none opacity-60 text-[var(--text-secondary)]" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-1 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            {hasReport ? "Regenerate" : "Generate"}
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
          title="No Monthly Summary Compiled"
          description={`No monthly operations summary compiled for ${getMonthName(selectedMonth)} ${selectedYear}. Generate it on demand below.`}
          action={
            <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate Monthly Report"}
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
                    {report.kpiScorecard.totalIssues}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {report.kpiScorecard.totalOverruns} SLA Overruns / {report.kpiScorecard.totalHoursLogged} hours logged
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
                    {changeRequests.totalNew} New / {changeRequests.totalCompleted} Completed this month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Tasks Performance</CardTitle>
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {tasks.totalCount}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {tasks.totalNew} New / {tasks.totalCompleted} Completed this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Predictive Insights Card */}
            {predictions && (
              <Card className="bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-emerald-500/5 border-[var(--border)] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                    <CardTitle className="text-xs font-semibold">Monthly Performance & Revenue Predictions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3">
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Projected Volume (Next Month)</p>
                    <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                      Issues: {predictions.issuesNext} | CRs: {predictions.crsNext}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Based on historical counts</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Projected Revenue Collection</p>
                    <p className="text-sm font-bold text-emerald-500 mt-1">
                      Rs. {predictions.projectedCollection.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">75% outstanding recovery model</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Projected Resource Load</p>
                    <p className={`text-sm font-bold mt-1 ${Number(predictions.loadFactor) > 95 ? "text-red-500" : "text-blue-500"}`}>
                      {predictions.loadFactor}% capacity
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{predictions.projectedHours}h requested / {predictions.capacity}h team</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Capacity Planning Advisor</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-normal mt-1 leading-snug">
                      {report.capacityPlanning.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Charts & Unified Project Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Executive Delivery & Financial Dual-Axis Chart */}
              <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Executive Delivery & Financial Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyProjectDeliveryFinanceData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} label={{ value: 'Volume', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)', fontSize: 10 } }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} label={{ value: 'Revenue (Rs.)', angle: 90, position: 'insideRight', style: { fill: 'var(--text-secondary)', fontSize: 10 } }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar yAxisId="left" dataKey="Issues" fill="#3498db" name="Issues Resolved" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="CRs" fill="#9b59b6" name="CRs Completed" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="Tasks" fill="#2ecc71" name="Tasks Completed" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="Billed" stroke="#e67e22" name="Billed Revenue" strokeWidth={2} activeDot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Delivery Share Donut */}
              <Card className="lg:col-span-1 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Monthly Delivery Share</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] flex flex-col justify-between pb-4">
                  <div className="h-[180px] w-full">
                    {monthlyDeliveryShare.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                        No delivery items this month
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={monthlyDeliveryShare}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {monthlyDeliveryShare.map((entry, index) => (
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
                      {monthlyDeliveryShare.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[var(--text-secondary)] font-normal">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unified project table */}
              <Card className="lg:col-span-3 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Monthly Project-wise Delivery Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {unifiedProjects.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">No monthly project operations recorded.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                            <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">Issues (Count)</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">CRs (New/Completed)</th>
                            <th className="p-3 text-center font-semibold text-[var(--text-secondary)] uppercase">Tasks (New/Completed)</th>
                            <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Billed Amount</th>
                            <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {unifiedProjects.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="p-3 font-medium">{row.project}</td>
                              <td className="p-3 text-center font-mono font-semibold">{row.issues}</td>
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
            {/* Executive Scorecard */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <StatCard
                label="SLA Success Rate"
                value={`${report.kpiScorecard.slaComplianceRate}%`}
                variant={report.kpiScorecard.slaComplianceRate >= 90 ? "success" : report.kpiScorecard.slaComplianceRate >= 75 ? "warning" : "danger"}
                icon={<ShieldAlert className="h-4 w-4" />}
              />
              <StatCard
                label="Avg Resolution"
                value={`${report.kpiScorecard.avgResolutionTimeHours} hrs`}
                icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
              />
              <StatCard
                label="Total Issues"
                value={report.kpiScorecard.totalIssues}
                icon={<Activity className="h-4 w-4 text-blue-500" />}
              />
              <StatCard
                label="SLA Overruns"
                value={report.kpiScorecard.totalOverruns}
                variant={report.kpiScorecard.totalOverruns > 0 ? "danger" : "success"}
                icon={<AlertOctagon className="h-4 w-4 text-red-500" />}
              />
              <StatCard
                label="Hours Logged"
                value={`${report.kpiScorecard.totalHoursLogged} hrs`}
                icon={<FileSpreadsheet className="h-4 w-4 text-purple-500" />}
              />
              <StatCard
                label="Utilization Rate"
                value={`${report.kpiScorecard.utilizationRate}%`}
                icon={<Percent className="h-4 w-4 text-emerald-500" />}
              />
            </div>

            {/* Project & Client Performance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Project Performance Table */}
              <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--primary)]" />
                    Project Support Performance
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
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Carry-Over</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Issues</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Budget SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.projectPerformance.map((p, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-4 text-sm font-medium">{p.project}</td>
                            <td className="p-4 text-sm text-right font-mono">{p.allocated}h</td>
                            <td className="p-4 text-sm text-right font-mono">{p.used}h</td>
                            <td className="p-4 text-sm text-right font-mono">{p.carryOver}</td>
                            <td className="p-4 text-sm text-right font-mono">{p.issuesCount}</td>
                            <td className="p-4 text-sm text-right">
                              {p.overrun ? (
                                <Badge variant="destructive" className="text-[10px] font-semibold">Overrun</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-600 bg-emerald-50">On Budget</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Issue Types Donut */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Volume by Issue Type</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-[250px] pb-4">
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={issueTypeChartData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {issueTypeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px]">
                    {report.issueTypeAnalysis.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[var(--text-secondary)] font-normal">{item.type} ({item.count})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members Efficiency & Clients Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Member Efficiency Table */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--primary)]" />
                    Developer Efficiency Scorecard
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Engineer</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Hours Logged</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Resolved</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Avg Handle Time</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Utilization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.memberEfficiency.map((m, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-4 text-sm font-medium">{m.name}</td>
                            <td className="p-4 text-sm text-right font-mono">{m.hoursLogged}h</td>
                            <td className="p-4 text-sm text-right font-mono">{m.issuesResolved}</td>
                            <td className="p-4 text-sm text-right font-mono">{m.avgHandleTime}h</td>
                            <td className="p-4 text-sm text-right font-mono font-semibold text-[var(--primary-text)]">
                              {m.utilizationRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Client Breakdown Table */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Client Load Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Client</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Total Issues</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Avg Handle Time</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Resolution Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.clientBreakdown.map((c, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-4 text-sm font-medium">{c.client}</td>
                            <td className="p-4 text-sm text-right font-mono">{c.totalIssues}</td>
                            <td className="p-4 text-sm text-right font-mono">{c.avgResolutionHours}h</td>
                            <td className="p-4 text-sm text-right font-mono font-semibold text-emerald-600">
                              {c.resolvedRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Root Cause for SLA Breaches & Capacity Planning Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Root Causes for SLA Breaches */}
              <Card className="lg:col-span-2 bg-[var(--surface)] border-red-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-red-500 flex items-center gap-1.5">
                    <AlertOctagon className="h-4 w-4" />
                    SLA Breaches & Root Causes ({report.slaBreachRootCauses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.slaBreachRootCauses.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                      No SLA breaches recorded this month!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {report.slaBreachRootCauses.map((b, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--text-primary)]">{b.issue}</span>
                            <span className="font-mono text-red-500">+{b.breachHours} hrs over</span>
                          </div>
                          <p className="text-[var(--text-secondary)] font-normal">
                            <span className="font-semibold text-[var(--text-primary)]">Reason: </span>
                            {b.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Capacity Planning Advisor */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-[var(--primary-text)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--primary-text)]" />
                    Capacity Planning Advisor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Projected Next Month Load</span>
                    <span className="font-mono font-semibold">{report.capacityPlanning.projectedHoursNextMonth}h</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Current Team Capacity</span>
                    <span className="font-mono font-semibold">{report.capacityPlanning.currentCapacity}h</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Forecasted Utilization</span>
                    <span className="font-mono font-semibold text-[var(--primary-text)]">{report.capacityPlanning.utilizationForecast}%</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-[var(--text-primary)] leading-relaxed">
                    <span className="font-bold text-[var(--primary-text)] block mb-1">Recommendation</span>
                    {report.capacityPlanning.recommendation}
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged this month.</p>
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged this month.</p>
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
                      <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged this month.</p>
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
                    <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No finance records logged this month.</p>
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
