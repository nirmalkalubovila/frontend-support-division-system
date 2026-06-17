import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export interface UserPerformanceEngineer {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  avatar?: string;
}

export interface UserPerformanceScorecard {
  engineer: UserPerformanceEngineer;
  metrics: {
    volume: {
      issuesResolved: number;
      hoursLogged: number;
      issuesResolvedPerHour: number;
      crsCompleted: number;
      tasksCompleted: number;
    };
    quality: {
      slaHitRate: number;
      reopenRate: number;
      escalationAwayCount: number;
      crEstimationAccuracy: number;
    };
    speed: {
      avgResolutionTime: number;
      avgResolutionTimePerPriority: Record<string, number>;
      p95ResolutionTime: number;
      medianResolutionTime: number;
      avgTimeToFirstResponse: number;
      boxPlot?: {
        min: number;
        q1: number;
        median: number;
        q3: number;
        max: number;
        outliers: number[];
      } | null;
    };
    utilization: {
      hoursLogged: number;
      capacityTarget: number;
      billableUtilizationRate: number;
      unloggedDays: number;
    };
  };
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hoursLogged: number;
    issuesResolved: number;
    slaRate: number;
    crsCompleted: number;
    billedHoursContribution: number;
  }[];
  visualizations: {
    calendarHeatmap: { date: string; hours: number }[];
    workTypeDonut: { name: string; value: number }[];
    issueTypeMixBar: { name: string; value: number }[];
    resolutionSpeedTrend: { weekLabel: string; personalAvg: number; teamAvg: number }[] | null;
    personalSlaRateTrend: { monthLabel: string; slaRate: number }[] | null;
  };
  flags: {
    type: string;
    severity: "high" | "medium" | "low";
    message: string;
  }[];
  predictions?: {
    projectedNextMonthHours: number;
    projectedIssuesResolved: number;
    isSlaAtRiskOfDecline: boolean;
    projectedCapacityUtil: string;
  } | null;
}

export interface TeamComparisonRow {
  engineer: UserPerformanceEngineer;
  hoursLogged: number;
  billablePercentage: number;
  issuesResolved: number;
  slaRate: number;
  avgResolutionTime: number;
  reopenPercentage: number;
  crAccuracyPercentage: number;
  unloggedDays: number;
  compositeScore: number;
  flags: { type: string; severity: "high" | "medium" | "low"; message: string }[];
  rank: number;
  projectBreakdown?: {
    projectId: string;
    projectName: string;
    hoursLogged: number;
    issuesResolved: number;
    slaRate: number;
    crsCompleted: number;
    billedHoursContribution: number;
  }[];
}

export interface TeamComparisonData {
  teamComparison: TeamComparisonRow[];
  teamAvgResolutionSpeed: number;
  workloadComparison: {
    name: string;
    issues: number;
    tasks: number;
    crs: number;
    total: number;
  }[];
  boxPlotData?: {
    name: string;
    stats?: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
      outliers: number[];
    } | null;
  }[] | null;
}

export const useGetTeamComparison = (startDate: string, endDate: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["/reports/user-performance/team-comparison", startDate, endDate],
    queryFn: async (): Promise<TeamComparisonData> => {
      const res = await axiosInstance.get("/reports/user-performance/team-comparison", {
        params: { startDate, endDate },
      });
      return res.data;
    },
    enabled: enabled && !!startDate && !!endDate,
  });

export const useGetUserScorecard = (startDate: string, endDate: string, userId?: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["/reports/user-performance/scorecard", startDate, endDate, userId],
    queryFn: async (): Promise<UserPerformanceScorecard> => {
      const res = await axiosInstance.get("/reports/user-performance/scorecard", {
        params: { startDate, endDate, userId },
      });
      return res.data;
    },
    enabled: enabled && !!startDate && !!endDate,
  });
