"use client";

import { useState } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  Percent,
  Clock,
  ChevronDown,
  Activity,
  GitPullRequest,
  CheckSquare,
  Wallet,
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components";
import { useGetAllProjects } from "@/api/services/project-management/project-service";
import { useGetUtilizationReport } from "@/api/services/reports/report-service";
import { StatCard } from "../components/stat-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function UtilizationView() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [projectId, setProjectId] = useState("");

  const { data: projectsData } = useGetAllProjects();
  const { data: report, isLoading } = useGetUtilizationReport(startDate, endDate, projectId || undefined);

  const hasData = !!report?.memberBreakdown && report.memberBreakdown.length > 0;

  // Extract unique project names for stacked chart rendering
  const projectNames = report
    ? Array.from(
        new Set(
          report.memberBreakdown.flatMap((m) => m.projects.map((p) => p.project))
        )
      )
    : [];

  const chartColors = [
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#f1c40f",
    "#2ecc71",
    "#e74c3c",
    "#34495e",
    "#e67e22",
  ];

  const chartData = report
    ? report.memberBreakdown.map((member) => {
        const item: Record<string, any> = { name: member.name };
        member.projects.forEach((p) => {
          item[p.project] = p.hours;
        });
        return item;
      })
    : [];

  // Calculate global aggregate indicators
  const totalLoggedHours = report
    ? report.memberBreakdown.reduce((sum, m) => sum + m.totalHours, 0)
    : 0;

  const totalBillableHours = report
    ? report.memberBreakdown.reduce((sum, m) => sum + m.billableHours, 0)
    : 0;

  const averageUtilization = report && report.memberBreakdown.length > 0
    ? Math.round(
        report.memberBreakdown.reduce((sum, m) => sum + m.utilizationRate, 0) /
          report.memberBreakdown.length
      )
    : 0;

  // Fallbacks to prevent conditional blank screens
  const crHoursBreakdown = report?.crHoursBreakdown || [];
  const developerWorkloadCompare = report?.developerWorkloadCompare || [];
  const financialEfficiency = report?.financialEfficiency || [];

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <Users className="h-5 w-5 text-[var(--primary-text)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Developer Resource Utilization
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Track engineer logged hours breakdown and allocations across projects
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[var(--background)] border-[var(--border)] text-xs h-9 w-36"
            />
            <span className="text-xs text-[var(--text-tertiary)]">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[var(--background)] border-[var(--border)] text-xs h-9 w-36"
            />
          </div>

          <div className="relative">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="">All Projects</option>
              {projectsData?.data?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 pointer-events-none opacity-60 text-[var(--text-secondary)]" />
          </div>
        </div>
      </div>

      {!hasData ? (
        <Card className="bg-[var(--surface)] border-[var(--border)] border-dashed py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-2">
            <Users className="h-10 w-10 text-[var(--text-tertiary)] opacity-35" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No Utilization Data</p>
            <p className="text-xs text-[var(--text-tertiary)] max-w-xs">
              No time logs recorded in this period. Update filters to select a different date range.
            </p>
          </CardContent>
        </Card>
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
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Team Average Utilization"
                value={`${averageUtilization}%`}
                variant={averageUtilization >= 80 ? "success" : averageUtilization >= 65 ? "warning" : "danger"}
                icon={<Percent className="h-4 w-4" />}
              />
              <StatCard
                label="Total Support Hours"
                value={`${totalLoggedHours} hrs`}
                icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
              />
              <StatCard
                label="Billable Support Hours"
                value={`${totalBillableHours} hrs`}
                icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
              />
              <StatCard
                label="Active Developers"
                value={report.memberBreakdown.length}
                icon={<Users className="h-4 w-4 text-purple-500" />}
              />
            </div>

            {/* Stacked Chart for Allocation Breakdown */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Hours Logged per Engineer by Project</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {projectNames.map((proj, idx) => (
                      <Bar
                        key={proj}
                        dataKey={proj}
                        stackId="a"
                        fill={chartColors[idx % chartColors.length]}
                        radius={[0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Issues Tab */}
          <TabsContent value="issues" className="space-y-6 outline-none">
            {/* Project Allocation Budgets & Engineer Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Project Allocation Table */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[var(--primary)]" />
                    Project Support Allocation Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-left">Project</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Allocated Hours</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Hours Logged</th>
                          <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Utilization Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.projectSummary.map((p, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-4 text-sm font-medium">{p.project}</td>
                            <td className="p-4 text-sm text-right font-mono">{p.totalAllocated}h</td>
                            <td className="p-4 text-sm text-right font-mono">{p.totalUsed}h</td>
                            <td className="p-4 text-sm text-right">
                              <span className={`font-mono text-sm font-semibold ${p.utilization >= 100 ? "text-red-500 font-bold" : p.utilization >= 75 ? "text-amber-500" : "text-emerald-500"}`}>
                                {p.utilization}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Engineer Utilization Breakdown */}
              <Card className="bg-[var(--surface)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--primary)]" />
                    Engineer Support Utilization List
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.memberBreakdown.map((m, idx) => (
                    <div key={idx} className="p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{m.name}</span>
                        <span className="font-mono text-xs text-[var(--text-secondary)]">
                          Logged: <span className="font-semibold text-[var(--text-primary)]">{m.totalHours}h</span> (Billable: {m.billableHours}h)
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                          <span>Utilization Rate</span>
                          <span className="font-semibold">{m.utilizationRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--primary)] rounded-full"
                            style={{ width: `${Math.min(m.utilizationRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 3. CRs Tab */}
          <TabsContent value="crs" className="space-y-6 outline-none">
            {/* CR Hours Breakdown */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--primary)]" />
                  Change Request Hours Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                        <th className="p-3 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                        <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Est. Hours</th>
                        <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Actual Hours</th>
                        <th className="p-3 text-right font-semibold text-[var(--text-secondary)] uppercase">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {crHoursBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-xs text-[var(--text-tertiary)] font-normal">
                            No CR hours logs tracked in this period.
                          </td>
                        </tr>
                      ) : (
                        crHoursBreakdown.map((c, i) => {
                          const variance = c.actualHours - c.estimatedHours;
                          return (
                            <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="p-3 font-medium">{c.project}</td>
                              <td className="p-3 text-right font-mono">{c.estimatedHours}h</td>
                              <td className="p-3 text-right font-mono">{c.actualHours}h</td>
                              <td className={`p-3 text-right font-mono font-semibold ${variance > 0 ? "text-red-500" : variance < 0 ? "text-emerald-500" : ""}`}>
                                {variance > 0 ? `+${variance.toFixed(1)}h` : `${variance.toFixed(1)}h`}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6 outline-none">
            {/* Developer Workload Compare Chart */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--primary)]" />
                  Engineer Workload: Active Issues vs Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {developerWorkloadCompare.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)] font-normal">
                    No workload details available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={developerWorkloadCompare} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="activeIssues" name="Active Issues" fill="#e67e22" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="activeTasks" name="Active Tasks" fill="#3498db" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Finance Tab */}
          <TabsContent value="finance" className="space-y-6 outline-none">
            {/* Financial Billing Efficiency */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Financial Billing Efficiency per Support Hour
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--background)] font-sans">
                        <th className="p-4 text-left font-semibold text-[var(--text-secondary)] uppercase">Project</th>
                        <th className="p-4 text-right font-semibold text-[var(--text-secondary)] uppercase">Total Billed</th>
                        <th className="p-4 text-right font-semibold text-[var(--text-secondary)] uppercase">Total Received</th>
                        <th className="p-4 text-right font-semibold text-[var(--text-secondary)] uppercase">Support Hours Logged</th>
                        <th className="p-4 text-right font-semibold text-[var(--text-secondary)] uppercase">Billing Rate / Hour</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {financialEfficiency.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-xs text-[var(--text-tertiary)] font-normal">
                            No billing records found in this range.
                          </td>
                        </tr>
                      ) : (
                        financialEfficiency.map((p, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="p-4 text-sm font-medium">{p.project}</td>
                            <td className="p-4 text-right font-mono">Rs. {p.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-mono text-emerald-500 font-semibold">Rs. {p.totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right font-mono">{p.totalUsedHours} hrs</td>
                            <td className="p-4 text-right font-mono font-bold text-[var(--primary-text)]">
                              Rs. {p.hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hr
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
