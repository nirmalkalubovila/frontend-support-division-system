import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords, PaginateResult } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// Report Types
// ──────────────────────────────────────────────────────────────

export type ReportType = "daily" | "weekly" | "monthly" | "executive";
export type ReportStatus = "generating" | "completed" | "failed";
export type GenerationMode = "automatic" | "manual";
export type KpiGranularity = "day" | "week" | "month";

export interface ReportRecord extends GlobalRecords {
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  data: DailyReportData | WeeklyReportData | MonthlyReportData | ExecutiveReportData;
  generatedBy: string | null;
  generationMode: GenerationMode;
  status: ReportStatus;
  metadata: Record<string, unknown>;
}

// ── Shared CR, Task, Finance metrics structures ────────────────
export interface ProjectCrSummary {
  project: string;
  new: number;
  completed: number;
  total: number;
}

export interface CrSummaryData {
  totalNew: number;
  totalCompleted: number;
  totalCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  totalEstimatedCost: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  byProject: ProjectCrSummary[];
}

export interface ProjectTaskSummary {
  project: string;
  new: number;
  completed: number;
  total: number;
}

export interface TaskSummaryData {
  totalNew: number;
  totalCompleted: number;
  totalCount: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  byProject: ProjectTaskSummary[];
}

export interface ProjectFinanceSummary {
  project: string;
  billed: number;
  received: number;
  outstanding: number;
}

export interface FinanceSummaryData {
  totalBilled: number;
  totalReceived: number;
  totalOutstanding: number;
  totalPartiallyPaid: number;
  statusBreakdown: Record<string, number>;
  byProject: ProjectFinanceSummary[];
}

// ── Daily Report ───────────────────────────────────────────────

export interface IssuesSummary {
  newToday: number;
  inProgress: number;
  resolvedToday: number;
  closedToday: number;
  reopened: number;
  total: number;
}

export interface SlaStatus {
  withinSla: number;
  breachedToday: number;
  atRisk: number;
  complianceRate: number;
}

export interface MemberActivityRow {
  name: string;
  role: string;
  hoursLogged: number;
  issuesTouched: number;
  issuesResolved: number;
}

export interface CriticalUnassignedRow {
  issueId: string;
  title: string;
  priority: string;
  createdAt: string;
  age: string;
}

export interface PendingClientRow {
  issueId: string;
  title: string;
  priority: string;
  pendingSince: string;
  client: string;
}

export interface DailyReportData {
  reportDate: string;
  issuesSummary: IssuesSummary;
  slaStatus: SlaStatus;
  memberActivity: MemberActivityRow[];
  criticalUnassigned: CriticalUnassignedRow[];
  pendingClient: PendingClientRow[];
  changeRequests?: CrSummaryData;
  tasks?: TaskSummaryData;
  finance?: FinanceSummaryData;
}

// ── Weekly Report ──────────────────────────────────────────────

export interface IssueVolumeByProject {
  project: string;
  newIssues: number;
  resolved: number;
  closed: number;
}

export interface IssueVolumeByPriority {
  priority: string;
  count: number;
}

export interface ResolutionTimeByPriority {
  priority: string;
  avgHours: number;
  medianHours: number;
  p95Hours: number;
}

export interface MemberWorkloadRow {
  name: string;
  hoursLogged: number;
  issuesHandled: number;
  avgResolutionHours: number;
}

export interface DeveloperVelocityRow {
  name: string;
  avgInProgressToResolved: number;
}

export interface ProjectHoursRow {
  project: string;
  allocated: number;
  used: number;
  remaining: number;
  trend: string;
}

export interface EscalationByType {
  type: string;
  count: number;
}

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  issueVolume: {
    totalNew: number;
    totalResolved: number;
    totalClosed: number;
    byProject: IssueVolumeByProject[];
    byPriority: IssueVolumeByPriority[];
  };
  resolutionTime: {
    avgHours: number;
    medianHours: number;
    p95Hours: number;
    byPriority: ResolutionTimeByPriority[];
  };
  slaCompliance: {
    rate: number;
    priorWeekRate: number;
    trend: string;
    totalWithinSla: number;
    totalBreached: number;
  };
  memberWorkload: MemberWorkloadRow[];
  developerVelocity: DeveloperVelocityRow[];
  backlogHealth: {
    zeroToThreeDays: number;
    threeToSevenDays: number;
    sevenToFourteenDays: number;
    overFourteenDays: number;
    total: number;
  };
  projectHours: ProjectHoursRow[];
  escalationCount: {
    total: number;
    byType: EscalationByType[];
  };
  changeRequests?: CrSummaryData;
  tasks?: TaskSummaryData;
  finance?: FinanceSummaryData;
}

// ── Monthly Report ─────────────────────────────────────────────

export interface KpiScorecard {
  slaComplianceRate: number;
  avgResolutionTimeHours: number;
  totalIssues: number;
  totalOverruns: number;
  totalHoursLogged: number;
  utilizationRate: number;
}

export interface ProjectPerformanceRow {
  project: string;
  allocated: number;
  used: number;
  carryOver: number;
  overrun: boolean;
  issuesCount: number;
}

export interface ClientBreakdownRow {
  client: string;
  totalIssues: number;
  resolvedRate: number;
  avgResolutionHours: number;
}

export interface ResourceAllocationRow {
  member: string;
  projects: { project: string; hours: number }[];
}

export interface MemberEfficiencyRow {
  name: string;
  hoursLogged: number;
  utilizationRate: number;
  issuesResolved: number;
  avgHandleTime: number;
}

export interface IssueTypeRow {
  type: string;
  count: number;
}

export interface SlaBreachRow {
  issue: string;
  reason: string;
  priority: string;
  breachHours: number;
}

export interface MonthlyReportData {
  month: number;
  year: number;
  period: string;
  kpiScorecard: KpiScorecard;
  projectPerformance: ProjectPerformanceRow[];
  clientBreakdown: ClientBreakdownRow[];
  resourceAllocation: ResourceAllocationRow[];
  memberEfficiency: MemberEfficiencyRow[];
  issueTypeAnalysis: IssueTypeRow[];
  trendAnalysis: {
    priorMonth: { totalIssues: number; slaRate: number; avgResolution: number };
    currentMonth: { totalIssues: number; slaRate: number; avgResolution: number };
    issuesTrend: string;
    slaTrend: string;
    resolutionTrend: string;
  };
  slaBreachRootCauses: SlaBreachRow[];
  capacityPlanning: {
    projectedHoursNextMonth: number;
    currentCapacity: number;
    utilizationForecast: number;
    recommendation: string;
  };
  changeRequests?: CrSummaryData;
  tasks?: TaskSummaryData;
  finance?: FinanceSummaryData;
}

// ── Executive Report ───────────────────────────────────────────

export interface ExecutiveReportData {
  period: { startDate: string; endDate: string };
  filters: { projectId: string; clientId: string };
  summary: {
    totalIssues: number;
    resolvedIssues: number;
    slaComplianceRate: number;
    avgResolutionHours: number;
    totalHoursLogged: number;
    totalBillableHours: number;
  };
  projectSummary: {
    project: string;
    issues: number;
    resolved: number;
    hoursUsed: number;
    allocated: number;
    slaRate: number;
  }[];
  topIssues: {
    issueId: string;
    title: string;
    priority: string;
    resolvedIn: string;
  }[];
  changeRequests?: CrSummaryData;
  tasks?: TaskSummaryData;
  finance?: FinanceSummaryData;
}

// ── KPI Analytics ──────────────────────────────────────────────

export interface KpiDataPoint {
  date: string;
  resolutionTimeAvg: number;
  slaComplianceRate: number;
  issuesNew: number;
  issuesResolved: number;
  velocityAvg: number;
  crsNew: number;
  crsCompleted: number;
  tasksNew: number;
  tasksCompleted: number;
  revenueBilled: number;
  revenueReceived: number;
}

export interface KpiAnalyticsData {
  granularity: KpiGranularity;
  startDate: string;
  endDate: string;
  dataPoints: KpiDataPoint[];
  aggregates: {
    avgResolutionTime: number;
    avgSlaRate: number;
    totalNewIssues: number;
    totalResolvedIssues: number;
    totalNewCrs: number;
    totalCompletedCrs: number;
    totalNewTasks: number;
    totalCompletedTasks: number;
    totalBilledRevenue: number;
    totalReceivedRevenue: number;
  };
}

// ── Utilization ────────────────────────────────────────────────

export interface MemberUtilizationProject {
  project: string;
  hours: number;
  allocated: number;
}

export interface MemberUtilizationRow {
  name: string;
  totalHours: number;
  billableHours: number;
  utilizationRate: number;
  projects: MemberUtilizationProject[];
}

export interface ProjectUtilizationRow {
  project: string;
  totalAllocated: number;
  totalUsed: number;
  utilization: number;
}

export interface DeveloperWorkloadCompareRow {
  name: string;
  activeIssues: number;
  activeTasks: number;
}

export interface CrHoursBreakdownRow {
  project: string;
  estimatedHours: number;
  actualHours: number;
}

export interface FinancialEfficiencyRow {
  project: string;
  totalBilled: number;
  totalReceived: number;
  totalUsedHours: number;
  hourlyRate: number;
}

export interface UtilizationData {
  period: { startDate: string; endDate: string };
  projectFilter: string;
  memberBreakdown: MemberUtilizationRow[];
  projectSummary: ProjectUtilizationRow[];
  developerWorkloadCompare?: DeveloperWorkloadCompareRow[];
  crHoursBreakdown?: CrHoursBreakdownRow[];
  financialEfficiency?: FinancialEfficiencyRow[];
}

// ── Report Schedule Settings ───────────────────────────────────

export interface ReportScheduleSettings {
  dailyEnabled: boolean;
  dailyCron: string;
  weeklyEnabled: boolean;
  weeklyCron: string;
  monthlyEnabled: boolean;
  monthlyCron: string;
}

// ──────────────────────────────────────────────────────────────
// Report API Service Hooks
// ──────────────────────────────────────────────────────────────

// ── Read Hooks ─────────────────────────────────────────────────

export const useGetDailyReport = (date?: string) =>
  useQuery({
    queryKey: ["/reports/daily", date],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (date) params.date = date;
      const res = await axiosInstance.get("/reports/daily", { params });
      return res.data as ReportRecord & { data: DailyReportData };
    },
  });

export const useGetWeeklyReport = (weekStart?: string) =>
  useQuery({
    queryKey: ["/reports/weekly", weekStart],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (weekStart) params.weekStart = weekStart;
      const res = await axiosInstance.get("/reports/weekly", { params });
      return res.data as ReportRecord & { data: WeeklyReportData };
    },
  });

export const useGetMonthlyReport = (month?: number, year?: number) =>
  useQuery({
    queryKey: ["/reports/monthly", month, year],
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const res = await axiosInstance.get("/reports/monthly", { params });
      return res.data as ReportRecord & { data: MonthlyReportData };
    },
  });

export const useGetKpiAnalytics = (
  startDate: string,
  endDate: string,
  granularity: KpiGranularity = "day"
) =>
  useQuery({
    queryKey: ["/reports/kpi", startDate, endDate, granularity],
    queryFn: async (): Promise<KpiAnalyticsData> => {
      const res = await axiosInstance.get("/reports/kpi", {
        params: { startDate, endDate, granularity },
      });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });

export const useGetUtilizationReport = (
  startDate: string,
  endDate: string,
  projectId?: string
) =>
  useQuery({
    queryKey: ["/reports/utilization", startDate, endDate, projectId],
    queryFn: async (): Promise<UtilizationData> => {
      const params: Record<string, string> = { startDate, endDate };
      if (projectId) params.projectId = projectId;
      const res = await axiosInstance.get("/reports/utilization", { params });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });

export const usePaginateReports = (
  page: number,
  limit: number,
  type?: ReportType
) =>
  useQuery({
    queryKey: ["/reports/paginate", page, limit, type],
    queryFn: async (): Promise<PaginateResult<ReportRecord>> => {
      const params: Record<string, unknown> = { page, limit };
      if (type) params.type = type;
      const res = await axiosInstance.get("/reports/paginate", { params });
      return res.data;
    },
  });

export const useGetReportById = (id: string) =>
  useQuery({
    queryKey: ["/reports", id],
    queryFn: async (): Promise<ReportRecord> => {
      const res = await axiosInstance.get(`/reports/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

// ── Mutation Hooks ─────────────────────────────────────────────

export const useGenerateDailyReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date?: string): Promise<ReportRecord> => {
      const res = await axiosInstance.post("/reports/daily/generate", {
        type: "daily",
        date,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/reports/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/reports/paginate"] });
    },
  });
};

export const useGenerateWeeklyReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date?: string): Promise<ReportRecord> => {
      const res = await axiosInstance.post("/reports/weekly/generate", {
        type: "weekly",
        date,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/reports/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/reports/paginate"] });
    },
  });
};

export const useGenerateMonthlyReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      month: number;
      year: number;
    }): Promise<ReportRecord> => {
      const res = await axiosInstance.post("/reports/monthly/generate", params);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/reports/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/reports/paginate"] });
    },
  });
};

export const useBuildExecutiveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      startDate: string;
      endDate: string;
      projectId?: string;
      clientId?: string;
    }): Promise<ReportRecord> => {
      const res = await axiosInstance.post("/reports/executive/build", params);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/reports/paginate"] });
    },
  });
};

// ── Export Hook ─────────────────────────────────────────────────

export const useExportReport = () =>
  useMutation({
    mutationFn: async ({
      reportId,
      format,
    }: {
      reportId: string;
      format: "pdf" | "excel";
    }) => {
      const res = await axiosInstance.get(`/reports/${reportId}/export`, {
        params: { format },
        responseType: "blob",
      });

      // Trigger browser download
      const blob = new Blob([res.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${reportId}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

export const useGetReportSchedule = () =>
  useQuery({
    queryKey: ["/system/report-schedule"],
    queryFn: async (): Promise<ReportScheduleSettings> => {
      const res = await axiosInstance.get("/system/report-schedule");
      return res.data;
    },
  });

export const useUpdateReportSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: ReportScheduleSettings): Promise<ReportScheduleSettings> => {
      const res = await axiosInstance.patch("/system/report-schedule", params);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/system/report-schedule"] });
    },
  });
};
