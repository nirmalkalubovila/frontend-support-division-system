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
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
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
  const COLORS = ["#2dae47", "#3b82f6", "#6366f1", "#ec4899", "#f59e0b", "#ef4444"];

  const issueTypeChartData = report
    ? report.issueTypeAnalysis.map((item) => ({
        name: item.type,
        value: item.count,
      }))
    : [];

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

      {isLoading ? (
        <ReportSkeleton />
      ) : !hasReport ? (
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
        <>
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
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px]">
                  {report.issueTypeAnalysis.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[var(--text-secondary)]">{item.type} ({item.count})</span>
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
        </>
      )}
    </div>
  );
}
