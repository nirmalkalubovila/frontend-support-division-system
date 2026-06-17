import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords, PaginateResult } from "@/types/global-types";
import type { Issue } from "../issue-management/issue-service";
import type { Project } from "../project-management/project-service";

export type WorkType =
  | "Backlog"
  | "Assigned"
  | "Planned Solution"
  | "In Progress"
  | "Testing"
  | "Resolved"
  | "Closed"
  | "Reopened"
  | "On Hold"
  | "Pending Client";

export interface TimeLogRecord extends GlobalRecords {
  issue: Issue | string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  project: Project | string;
  startTime: string;
  endTime: string | null;
  duration: number; // in hours
  workType: WorkType;
  note: string;
  isBillable: boolean;
  approved: boolean;
}

export interface TimeLogQueryParams {
  page?: number;
  limit?: number;
  issue?: string;
  user?: string;
  project?: string;
  approved?: boolean;
  sortBy?: string;
}

export interface StartTimerDto {
  issueId: string;
  workType: WorkType;
  note?: string;
  isBillable?: boolean;
}

export interface StopTimerDto {
  issueId: string;
  note?: string;
}

export interface CreateManualLogDto {
  issueId: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  workType: WorkType;
  note?: string;
  isBillable?: boolean;
}

export interface UpdateTimeLogDto {
  workType?: WorkType;
  note?: string;
  duration?: number;
  isBillable?: boolean;
  approved?: boolean;
  startTime?: string;
  endTime?: string;
}

// ──────────────────────────────────────────────────────────────
// API Query Hooks
// ──────────────────────────────────────────────────────────────

export const useGetTimeLogs = (params: TimeLogQueryParams = {}) =>
  useQuery({
    queryKey: ["/time-logs", params],
    queryFn: async (): Promise<PaginateResult<TimeLogRecord>> => {
      const res = await axiosInstance.get("/time-logs", { params });
      return res.data;
    },
  });

// ──────────────────────────────────────────────────────────────
// API Mutation Hooks
// ──────────────────────────────────────────────────────────────

export const useStartTimer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StartTimerDto): Promise<TimeLogRecord> => {
      const res = await axiosInstance.post("/time-logs/start", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/time-logs"] });
    },
  });
};

export const useStopTimer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StopTimerDto): Promise<TimeLogRecord> => {
      const res = await axiosInstance.post("/time-logs/stop", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};

export const useCreateManualLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateManualLogDto): Promise<TimeLogRecord> => {
      const res = await axiosInstance.post("/time-logs/manual", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};

export const useUpdateTimeLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      logId,
      data,
    }: {
      logId: string;
      data: UpdateTimeLogDto;
    }): Promise<TimeLogRecord> => {
      const res = await axiosInstance.patch(`/time-logs/${logId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/time-logs", variables.logId] });
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};

export const useDeleteTimeLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string): Promise<void> => {
      await axiosInstance.delete(`/time-logs/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};
