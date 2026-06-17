import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export interface ProjectPerformanceData {
  period: { startDate: string; endDate: string };
  rangeDays: number;
  issues: {
    summary: {
      opened: number;
      resolved: number;
      closed: number;
      reopened: number;
      inProgress: number;
      onHold: number;
    };
    priorityBreakdown: { Critical: number; High: number; Medium: number; Low: number };
    typeBreakdown: Record<string, number>;
    projectBreakdown: { projectId: string; projectName: string; count: number }[];
    slaMetrics: {
      complianceRate: number;
      breachCountByPriority: { Critical: number; High: number; Medium: number; Low: number };
      averageBreachDurationHours: number;
      liveAtRiskCount: number;
    };
    resolutionMetrics: {
      averageResolutionTimeHours: number;
      averageResolutionTimeByPriority: Record<string, number>;
      p95ResolutionTimeHours: number;
      medianResolutionTimeHours: number;
      reopenRate: number;
    };
    trend: { date: string; new: number; resolved: number; delta: number }[] | null;
    predictions: {
      projectedNextMonthVolume: number;
      projectedSlaRate: number;
      anomalies: { type: string; percentageIncrease: number; message: string }[];
    } | null;
  };
  crs: {
    summary: {
      new: number;
      completed: number;
      inProgress: number;
      cancelled: number;
    };
    projectBreakdown: { projectId: string; projectName: string; count: number }[];
    accuracyMetrics: {
      averageAccuracy: number;
      projectAccuracy: { projectId: string; projectName: string; accuracy: number }[];
      underestimatedCount: number;
      averageUnderestimatedHours: number;
      overestimatedCount: number;
    };
    deliveryMetrics: {
      averageCompletionTimeDays: number;
      onTimeDeliveryRate: number;
      liveOverdueCount: number;
    };
    financials: {
      totalBilledHours: number;
      totalRevenue: number;
      effectiveHourlyRate: number;
    };
    trend: { label: string; new: number; completed: number; accuracy: number }[] | null;
    predictions: {
      projectedCrVolume: number;
      calibrationFlag: string | null;
    } | null;
  };
  tasks: {
    summary: {
      created: number;
      completed: number;
      inProgress: number;
      liveOverdueCount: number;
    };
    projectBreakdown: { projectId: string; projectName: string; count: number }[];
    priorityBreakdown: { Critical: number; High: number; Medium: number; Low: number };
    deliveryMetrics: {
      completionRate: number;
      averageCompletionTimeHours: number;
      liveAverageDaysOverdue: number;
    };
    trend: { date: string; created: number; completed: number; rate: number }[] | null;
  };
  finance: {
    summary: {
      billed: number;
      collected: number;
      outstanding: number;
      collectionRate: number;
    };
    projectDetails: {
      projectId: string;
      projectName: string;
      allocatedHours: number;
      usedHours: number;
      remainingHours: number;
      overrunHours: number;
      overrunCost: number;
      overrunFlag: boolean;
      effectiveHourlyRate: number;
    }[];
    trend: { label: string; billed: number; collected: number }[] | null;
    projectBurnRate: { projectName: string; weeklyBurn: number; weeklyNeeded: number }[] | null;
    predictions: {
      projectedOverruns: string[];
      projectedRevenue: number;
      projectedOutstanding: number;
    } | null;
  };
  projectHealthSummary: {
    projectName: string;
    contractType: string;
    openIssues: number;
    slaRate: number;
    hoursUsed: number;
    hoursAllocated: number;
    crAccuracy: number;
    billed: number;
    collected: number;
    outstanding: number;
    healthStatus: "Green" | "Amber" | "Red";
  }[];
}

export const useGetProjectPerformance = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: ["/reports/performance", startDate, endDate],
    queryFn: async (): Promise<ProjectPerformanceData> => {
      const res = await axiosInstance.get("/reports/performance", {
        params: { startDate, endDate },
      });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
