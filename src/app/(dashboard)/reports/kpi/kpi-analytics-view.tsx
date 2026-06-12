"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components";
import { useGetKpiAnalytics } from "@/api/services/reports/report-service";
import type { KpiGranularity } from "@/api/services/reports/report-service";
import { StatCard } from "../components/stat-card";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function KpiAnalyticsView() {
  const [startDate, setStartDate] = useState(() => {
    // Default to 30 days ago
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [granularity, setGranularity] = useState<KpiGranularity>("day");

  const { data: analytics, isLoading } = useGetKpiAnalytics(startDate, endDate, granularity);

  const hasData = !!analytics?.dataPoints && analytics.dataPoints.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filtering Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <TrendingUp className="h-5 w-5 text-[var(--primary-text)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Interactive KPI Trends
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Analyze speed stats, volumes, and SLA performance over time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="space-y-0.5">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[var(--background)] border-[var(--border)] text-xs h-9 w-36"
              />
            </div>
            <span className="text-xs text-[var(--text-tertiary)]">to</span>
            <div className="space-y-0.5">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[var(--background)] border-[var(--border)] text-xs h-9 w-36"
              />
            </div>
          </div>

          <div className="relative">
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as KpiGranularity)}
              className="appearance-none h-9 pl-3 pr-8 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 pointer-events-none opacity-60 text-[var(--text-secondary)]" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
      ) : !hasData ? (
        <Card className="bg-[var(--surface)] border-[var(--border)] border-dashed py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-2">
            <TrendingUp className="h-10 w-10 text-[var(--text-tertiary)] opacity-35" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No Trend Data Found</p>
            <p className="text-xs text-[var(--text-tertiary)] max-w-xs">
              No support logs or resolved issues exist for the selected date range. Try widening the range.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Aggregate Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Avg SLA Success"
              value={`${analytics.aggregates.avgSlaRate}%`}
              variant={analytics.aggregates.avgSlaRate >= 90 ? "success" : analytics.aggregates.avgSlaRate >= 75 ? "warning" : "danger"}
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <StatCard
              label="Avg Resolution Speed"
              value={`${analytics.aggregates.avgResolutionTime} hrs`}
              icon={<Clock className="h-4 w-4 text-[var(--primary-text)]" />}
            />
            <StatCard
              label="Total New Issues"
              value={analytics.aggregates.totalNewIssues}
              icon={<Activity className="h-4 w-4 text-blue-500" />}
            />
            <StatCard
              label="Total Resolved"
              value={analytics.aggregates.totalResolvedIssues}
              variant="success"
              icon={<ArrowUpRight className="h-4 w-4 text-emerald-500" />}
            />
          </div>

          {/* Charts Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Compliance Trend */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">SLA Compliance Rate Trend (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dataPoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSla" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <YAxis domain={[50, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="slaComplianceRate" name="SLA Rate" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSla)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resolution Time Trend */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Average Resolution Speed (Hours)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dataPoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="resolutionTimeAvg" name="Avg Hours" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Issues Volumes */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Support Volume Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dataPoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="issuesNew" name="New Issues" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="issuesResolved" name="Resolved Issues" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Developer velocity over time */}
            <Card className="bg-[var(--surface)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Active Developer Velocity (Avg Hours)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dataPoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="velocityAvg" name="Velocity Hours" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
