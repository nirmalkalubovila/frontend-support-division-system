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

  if (isLoading) return <ReportSkeleton />;

  // Backlog colors
  const BACKLOG_COLORS = ["#2dae47", "#3b82f6", "#f59e0b", "#ef4444"];

  const backlogChartData = report
    ? [
        { name: "0-3 Days", value: report.backlogHealth.zeroToThreeDays },
        { name: "3-7 Days", value: report.backlogHealth.threeToSevenDays },
        { name: "7-14 Days", value: report.backlogHealth.sevenToFourteenDays },
        { name: ">14 Days", value: report.backlogHealth.overFourteenDays },
      ].filter((d) => d.value > 0)
    : [];

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
        <>
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="newIssues" name="New" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closed" name="Closed" fill="#94a3b8" radius={[4, 4, 0, 0]} />
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
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--surface)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[0] }} />
                    <span className="text-[var(--text-secondary)]">0-3 days ({report.backlogHealth.zeroToThreeDays})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[1] }} />
                    <span className="text-[var(--text-secondary)]">3-7 days ({report.backlogHealth.threeToSevenDays})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[2] }} />
                    <span className="text-[var(--text-secondary)]">7-14 days ({report.backlogHealth.sevenToFourteenDays})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BACKLOG_COLORS[3] }} />
                    <span className="text-[var(--text-secondary)]">&gt;14 days ({report.backlogHealth.overFourteenDays})</span>
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
        </>
      )}
    </div>
  );
}
