"use client";

import { useState } from "react";
import {
  Briefcase,
  FileText,
  Clock,
  ShieldAlert,
  TrendingUp,
  Loader2,
  GitPullRequest,
  CheckSquare,
  Wallet,
  Activity,
  DollarSign,
  AlertCircle
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components";
import { useGetAllProjects, type Project } from "@/api/services/project-management/project-service";
import { useGetAllClients, type Client } from "@/api/services/project-management/client-service";
import {
  useBuildExecutiveReport,
  useExportReport,
} from "@/api/services/reports/report-service";
import type { ExecutiveReportData, ReportRecord } from "@/api/services/reports/report-service";
import { toast } from "sonner";
import { StatCard } from "../components/stat-card";
import { ExportDropdown } from "../components/export-dropdown";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function ExecutiveBuilder() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");

  const { data: projectsData } = useGetAllProjects();
  const { data: clientsData } = useGetAllClients();
  const buildMutation = useBuildExecutiveReport();
  const exportMutation = useExportReport();

  const [generatedReportRecord, setGeneratedReportRecord] = useState<ReportRecord | null>(null);

  const handleBuildReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    buildMutation.mutate(
      {
        startDate,
        endDate,
        projectId: projectId || undefined,
        clientId: clientId || undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratedReportRecord(data);
          toast.success("Executive report compiled successfully!");
        },
        onError: (err: any) => {
          const errMsg = err?.response?.data?.message || err?.message || "Failed to compile report";
          toast.error(errMsg);
        },
      }
    );
  };

  const report = generatedReportRecord?.data as ExecutiveReportData | undefined;
  const reportId = generatedReportRecord?._id;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  const getUnifiedProjectData = () => {
    const projectMap: Record<string, { project: string; issues: number; resolved: number; newCrs: number; completedCrs: number; newTasks: number; completedTasks: number; billed: number; received: number }> = {};
    
    if (report?.projectSummary) {
      report.projectSummary.forEach((p) => {
        if (!projectMap[p.project]) {
          projectMap[p.project] = { project: p.project, issues: 0, resolved: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
        }
        projectMap[p.project].issues = p.issues;
        projectMap[p.project].resolved = p.resolved;
      });
    }

    changeRequests.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, issues: 0, resolved: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newCrs = p.new;
      projectMap[p.project].completedCrs = p.completed;
    });

    tasks.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, issues: 0, resolved: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].newTasks = p.new;
      projectMap[p.project].completedTasks = p.completed;
    });

    finance.byProject.forEach((p) => {
      if (!projectMap[p.project]) {
        projectMap[p.project] = { project: p.project, issues: 0, resolved: 0, newCrs: 0, completedCrs: 0, newTasks: 0, completedTasks: 0, billed: 0, received: 0 };
      }
      projectMap[p.project].billed = p.billed;
      projectMap[p.project].received = p.received;
    });

    return Object.values(projectMap);
  };

  const unifiedProjects = getUnifiedProjectData();

  // Composed Dual-Axis data mapping
  const monthlyProjectDeliveryFinanceData = unifiedProjects.map(p => ({
    name: p.project,
    Issues: p.resolved,
    CRs: p.completedCrs,
    Tasks: p.completedTasks,
    Billed: p.billed,
  }));

  // Operations Delivery Share
  const deliveryShareData = [
    { name: "Issues Resolved", value: report ? report.summary.resolvedIssues : 0, color: "#3498db" },
    { name: "CRs Completed", value: changeRequests.totalCompleted, color: "#9b59b6" },
    { name: "Tasks Completed", value: tasks.totalCompleted, color: "#2ecc71" },
  ].filter(d => d.value > 0);

  // Predictions Helper
  const getExecutivePredictions = () => {
    if (!report) return null;
    const issuesNext = Math.ceil(report.summary.totalIssues * 1.05);
    const crsNext = Math.ceil(changeRequests.totalCount * 1.08);
    const tasksNext = Math.ceil(tasks.totalCount * 1.10);
    const projectedCollection = finance.totalReceived + (finance.totalOutstanding * 0.75);

    return {
      issuesNext,
      crsNext,
      tasksNext,
      projectedCollection,
    };
  };

  const predictions = getExecutivePredictions();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <Card className="bg-[var(--surface)] border-[var(--border)] h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[var(--primary)]" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuildReport} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[var(--background)] border-[var(--border)] text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[var(--background)] border-[var(--border)] text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="client">Client (Optional)</Label>
                <select
                  id="client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="">All Clients</option>
                  {clientsData?.data?.map((c: Client) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="project">Project (Optional)</Label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="">All Projects</option>
                  {projectsData?.data?.map((p: Project) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                disabled={buildMutation.isPending}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs h-9 mt-2 font-medium"
              >
                {buildMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Compiling...
                  </>
                ) : (
                  "Compile Report"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <div className="lg:col-span-3 space-y-6">
          {!report ? (
            <Card className="bg-[var(--surface)] border-[var(--border)] border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="h-12 w-12 text-[var(--text-tertiary)] opacity-35" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ready to Build</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs font-normal">
                    Choose your parameters on the left side and click Compile Report to build a custom client-ready executive summary.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Preview Header */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <Badge className="bg-[var(--primary)]/10 text-[var(--primary-text)] font-semibold text-xs mb-2">
                        Executive Summary Preview
                      </Badge>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        Support Operations Performance Summary
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 font-normal">
                        Period: {formatDate(report.period.startDate)} – {formatDate(report.period.endDate)}
                      </p>
                    </div>

                    {reportId && (
                      <ExportDropdown
                        onExportPdf={() => exportMutation.mutate({ reportId, format: "pdf" })}
                        onExportExcel={() => exportMutation.mutate({ reportId, format: "excel" })}
                        isLoading={exportMutation.isPending}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs list */}
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
                  {/* Summary aggregate metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-[var(--surface)] border-[var(--border)]">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Issues Volume</CardTitle>
                        <Activity className="h-4 w-4 text-[var(--primary)]" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-[var(--text-primary)]">
                          {report.summary.totalIssues}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          {report.summary.resolvedIssues} Resolved / SLA rate: {report.summary.slaComplianceRate}%
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
                          {tasks.totalNew} New / {tasks.totalCompleted} Completed
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
                          <CardTitle className="text-xs font-semibold">Custom Period Performance & Revenue Projections</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3">
                        <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Forecasted Issues (Next Period)</p>
                          <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{predictions.issuesNext} <span className="text-xs font-normal text-[var(--text-tertiary)]">incoming</span></p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Estimated range projection</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Forecasted CRs (Next Period)</p>
                          <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{predictions.crsNext} <span className="text-xs font-normal text-[var(--text-tertiary)]">completed</span></p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Based on completion metrics</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Forecasted Tasks (Next Period)</p>
                          <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{predictions.tasksNext} <span className="text-xs font-normal text-[var(--text-tertiary)]">completed</span></p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Projected execution rate</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                          <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Projected Revenue Collection</p>
                          <p className="text-lg font-bold text-emerald-500 mt-1">Rs. {predictions.projectedCollection.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Billed + 75% collection index</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Delivery & Financial Dual-Axis Chart */}
                    <Card className="lg:col-span-2 bg-[var(--surface)] border-[var(--border)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Delivery Velocity & Financial Summary</CardTitle>
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

                    {/* Delivery Share Donut Chart */}
                    <Card className="lg:col-span-1 bg-[var(--surface)] border-[var(--border)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Delivery Share Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[280px] flex flex-col justify-between pb-4">
                        <div className="h-[180px] w-full">
                          {deliveryShareData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                              No delivery items recorded
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={deliveryShareData}
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {deliveryShareData.map((entry, index) => (
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
                            {deliveryShareData.map((entry, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[var(--text-secondary)] font-normal">{entry.name} ({entry.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Unified project comparison table */}
                    <Card className="lg:col-span-3 bg-[var(--surface)] border-[var(--border)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Project-wise Delivery Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {unifiedProjects.length === 0 ? (
                          <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">No project metrics recorded in this period.</div>
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
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {unifiedProjects.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                                    <td className="p-3 font-medium">{row.project}</td>
                                    <td className="p-3 text-center font-mono">
                                      <span className={row.issues > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>{row.issues}</span>
                                      <span className="text-[var(--text-tertiary)]">/</span>
                                      <span className={row.resolved > 0 ? "text-emerald-500 font-semibold" : "text-[var(--text-tertiary)]"}>{row.resolved}</span>
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
                                    <td className="p-3 text-right font-mono text-emerald-500 font-semibold">
                                      {row.billed > 0 ? `Rs. ${row.billed.toLocaleString()}` : "—"}
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
                  {/* KPI Scorecard Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <StatCard
                      label="SLA Compliance Rate"
                      value={`${report.summary.slaComplianceRate}%`}
                      variant={report.summary.slaComplianceRate >= 90 ? "success" : report.summary.slaComplianceRate >= 75 ? "warning" : "danger"}
                      icon={<ShieldAlert className="h-4 w-4" />}
                    />
                    <StatCard
                      label="Total Resolved Issues"
                      value={`${report.summary.resolvedIssues} / ${report.summary.totalIssues}`}
                      icon={<FileText className="h-4 w-4 text-blue-500" />}
                    />
                    <StatCard
                      label="Avg Resolution Speed"
                      value={`${report.summary.avgResolutionHours} hrs`}
                      icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
                    />
                    <StatCard
                      label="Total Hours Spent"
                      value={`${report.summary.totalHoursLogged} hrs`}
                      icon={<Briefcase className="h-4 w-4 text-purple-500" />}
                    />
                    <StatCard
                      label="Billable Hours"
                      value={`${report.summary.totalBillableHours} hrs`}
                      variant="success"
                      icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                    />
                  </div>

                  {/* Project Allocation details */}
                  <Card className="bg-[var(--surface)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Project Operations Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Project</th>
                              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Issues</th>
                              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Resolved</th>
                              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Allocated</th>
                              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Hours Used</th>
                              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">SLA Success</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {report.projectSummary.map((proj, idx) => (
                              <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                                <td className="p-4 text-sm font-medium">{proj.project}</td>
                                <td className="p-4 text-sm text-right font-mono">{proj.issues}</td>
                                <td className="p-4 text-sm text-right font-mono">{proj.resolved}</td>
                                <td className="p-4 text-sm text-right font-mono">{proj.allocated}h</td>
                                <td className="p-4 text-sm text-right font-mono">{proj.hoursUsed}h</td>
                                <td className="p-4 text-sm text-right">
                                  <span className={`font-mono text-sm font-semibold ${proj.slaRate >= 90 ? "text-emerald-500" : proj.slaRate >= 75 ? "text-amber-500" : "text-red-500"}`}>
                                    {proj.slaRate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top/Major Issues resolved */}
                  <Card className="bg-[var(--surface)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Key Resolved Issues in this Period</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {report.topIssues.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                          No issues resolved in this period.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">ID</th>
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Title</th>
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Priority</th>
                                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Resolution Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {report.topIssues.map((issue, idx) => (
                                <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                                  <td className="p-4 text-sm font-mono">{issue.issueId}</td>
                                  <td className="p-4 text-sm font-medium">{issue.title}</td>
                                  <td className="p-4 text-sm">
                                    <Badge
                                      className="text-[10px] py-0.5 px-1.5 font-semibold text-white"
                                      style={{
                                        backgroundColor: `var(--priority-${issue.priority.toLowerCase()})`,
                                      }}
                                    >
                                      {issue.priority}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-sm text-right font-mono">{issue.resolvedIn}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                            <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged in this period.</p>
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
                            <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No Change Requests logged in this period.</p>
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
                            <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged in this period.</p>
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
                            <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No active tasks logged in this period.</p>
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

                  {/* Payment status distribution */}
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
                          <p className="text-xs text-[var(--text-tertiary)] py-2 text-center w-full">No finance records logged in this period.</p>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
