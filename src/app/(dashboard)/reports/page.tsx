"use client";

import { BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components";
import { useHasPermission } from "@/hooks/use-permissions";
import { DailyReportView } from "./daily/daily-report-view";
import { WeeklyReportView } from "./weekly/weekly-report-view";
import { MonthlyReportView } from "./monthly/monthly-report-view";
import { ExecutiveBuilder } from "./executive/executive-builder";
import { KpiAnalyticsView } from "./kpi/kpi-analytics-view";
import { UtilizationView } from "./utilization/utilization-view";

export default function ReportsPage() {
  const canReadDaily = useHasPermission("reports.daily_report.read");
  const canReadWeekly = useHasPermission("reports.weekly_report.read");
  const canReadMonthly = useHasPermission("reports.monthly_report.read");
  const canReadExecutive = useHasPermission("reports.executive_report.read");
  const canReadKpi = useHasPermission("reports.kpi_analytics.read");
  const canReadUtilization = useHasPermission("reports.daily_report.read");

  const defaultTab = canReadDaily
    ? "daily"
    : canReadWeekly
    ? "weekly"
    : canReadMonthly
    ? "monthly"
    : canReadExecutive
    ? "executive"
    : canReadKpi
    ? "kpi"
    : canReadUtilization
    ? "utilization"
    : undefined;

  if (!defaultTab) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--text-secondary)] font-medium">Access Denied</p>
          <p className="text-xs text-[var(--text-tertiary)] font-normal">You do not have permission to view support reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
          Analytics & Reports
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Monitor division support performance metrics, workloads, client agreements, and resource utilization
        </p>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-[var(--surface)] border border-[var(--border)] flex flex-wrap h-auto p-1 gap-1">
          {canReadDaily && <TabsTrigger value="daily" className="text-xs py-1.5 px-3">Daily</TabsTrigger>}
          {canReadWeekly && <TabsTrigger value="weekly" className="text-xs py-1.5 px-3">Weekly</TabsTrigger>}
          {canReadMonthly && <TabsTrigger value="monthly" className="text-xs py-1.5 px-3">Monthly</TabsTrigger>}
          {canReadExecutive && <TabsTrigger value="executive" className="text-xs py-1.5 px-3">Executive Builder</TabsTrigger>}
          {canReadKpi && <TabsTrigger value="kpi" className="text-xs py-1.5 px-3">KPI Trends</TabsTrigger>}
          {canReadUtilization && <TabsTrigger value="utilization" className="text-xs py-1.5 px-3">Resource Utilization</TabsTrigger>}
        </TabsList>

        {canReadDaily && (
          <TabsContent value="daily" className="mt-4">
            <DailyReportView />
          </TabsContent>
        )}

        {canReadWeekly && (
          <TabsContent value="weekly" className="mt-4">
            <WeeklyReportView />
          </TabsContent>
        )}

        {canReadMonthly && (
          <TabsContent value="monthly" className="mt-4">
            <MonthlyReportView />
          </TabsContent>
        )}

        {canReadExecutive && (
          <TabsContent value="executive" className="mt-4">
            <ExecutiveBuilder />
          </TabsContent>
        )}

        {canReadKpi && (
          <TabsContent value="kpi" className="mt-4">
            <KpiAnalyticsView />
          </TabsContent>
        )}

        {canReadUtilization && (
          <TabsContent value="utilization" className="mt-4">
            <UtilizationView />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
