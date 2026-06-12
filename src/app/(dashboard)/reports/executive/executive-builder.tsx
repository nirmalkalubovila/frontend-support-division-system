"use client";

import { useState } from "react";
import {
  Briefcase,
  FileText,
  Clock,
  ShieldAlert,
  TrendingUp,
  Loader2,
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
