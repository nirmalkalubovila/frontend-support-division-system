import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export interface ClientHealthRow {
  clientName: string;
  contractType: string;
  slaRate: number;
  issuesHandled: number;
  hoursUsed: number;
  hoursAllocated: number;
  billed: number;
  outstanding: number;
  trend: "up" | "down" | "flat";
  health: "Green" | "Amber" | "Red";
}

export interface ExecutivePerformanceData {
  period: { startDate: string; endDate: string };
  rangeDays: number;
  scorecard: {
    overallSlaRate: number;
    activeProjectsCount: number;
    activeProjectsDelta: number;
    revenueBilled: number;
    revenueCollected: number;
    outstandingBalance: number;
    projectsOverrunStr: string;
    teamUtilization: number;
    totalIssuesCount: number;
    issuesResolvedPct: number;
    collectionRate: number;
  };
  clientHealthMatrix: ClientHealthRow[];
  financials: {
    revenueBilled: number;
    revenueCollected: number;
    outstandingBalance: number;
    ytdBilled: number;
    ytdCollected: number;
    overrunCostTotal: number;
    divisionEffectiveRate: number;
    outstandingPerClient: { clientName: string; outstanding: number }[];
    collectionRateTrend: { monthLabel: string; collectionRate: number }[];
    revenueByContractType: { name: string; value: number }[];
    topClients: { clientName: string; revenue: number }[];
  };
  operationalSignals: {
    slaComplianceTrend: { monthLabel: string; slaRate: number }[];
    avgResolutionTimeTrend: { monthLabel: string; avgResHours: number }[];
    utilizationRateTrend: { monthLabel: string; utilizationRate: number }[];
    backlogAgeBreakdown: {
      zeroToThree: number;
      threeToSeven: number;
      sevenToFourteen: number;
      overFourteen: number;
    };
    issueDemandTrend: { monthLabel: string; created: number; resolved: number }[];
    crDeliveryRate: number;
  };
  predictions: {
    projectedDemandHours: number;
    monthlyCapacity: number;
    capacityFlag: string | null;
    projectedNextMonthRevenue: number;
    atRiskContracts: { projectName: string; overrunHours: number; overrunCost: number }[];
    decliningClients: string[];
    momGrowth: number;
    yoyGrowth: number;
    efficiencyTrend: "stable" | "improving" | "declining";
  } | null;
  charts: {
    revenueTrend: { label: string; billed: number; collected: number }[];
    clientSla: { name: string; slaRate: number; health: string }[];
    projectUtilization: {
      projectName: string;
      percentage: number;
      actualPercentage: number;
      used: number;
      allocated: number;
      status: "overrun" | "warning" | "healthy";
    }[];
    divisionUtilizationDonut: { name: string; value: number }[];
  };
}

export const useGetExecutivePerformance = (startDate: string, endDate: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["/reports/executive-performance", startDate, endDate],
    queryFn: async (): Promise<ExecutivePerformanceData> => {
      const res = await axiosInstance.get("/reports/executive-performance", {
        params: { startDate, endDate },
      });
      return res.data;
    },
    enabled: enabled && !!startDate && !!endDate,
  });
