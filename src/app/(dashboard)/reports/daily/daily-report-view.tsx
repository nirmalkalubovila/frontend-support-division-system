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
  useGetDailyReport,
  useGenerateDailyReport,
  useExportReport,
} from "@/api/services/reports/report-service";
import type { DailyReportData } from "@/api/services/reports/report-service";

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

  if (isLoading) return <ReportSkeleton />;

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
        <>
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
        </>
      )}
    </div>
  );
}
