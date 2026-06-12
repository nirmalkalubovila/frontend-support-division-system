import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords, PaginateResult, PaginationRequest } from "@/types/global-types";
import type { Client } from "./client-service";

// ──────────────────────────────────────────────────────────────
// Project Types
// ──────────────────────────────────────────────────────────────

export interface ProjectMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project extends GlobalRecords {
  name: string;
  client: Client | string;
  contractType: "Monthly Retainer" | "Per-Incident" | "Time & Material" | "Fixed";
  allocatedHours: number;
  usedHours: number;
  members: ProjectMember[] | string[];
  isActive: boolean;
}

export interface CreateProject {
  name: string;
  client: string;
  contractType: string;
  allocatedHours?: number;
  members?: string[];
}

export interface UpdateProject {
  name?: string;
  contractType?: string;
  allocatedHours?: number;
  members?: string[];
  isActive?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Project API Service Hooks
// ──────────────────────────────────────────────────────────────

export const usePaginateProjects = (params: PaginationRequest & { client?: string }) =>
  useQuery({
    queryKey: ["/projects/paginate", params.page, params.limit, params.search, params.client],
    queryFn: async (): Promise<PaginateResult<Project>> => {
      const res = await axiosInstance.get("/projects", { params });
      return res.data;
    },
  });

export const useGetAllProjects = (clientId?: string) =>
  useQuery({
    queryKey: ["/projects/all", clientId],
    queryFn: async (): Promise<PaginateResult<Project>> => {
      const params: Record<string, unknown> = { limit: 200 };
      if (clientId) params.client = clientId;
      const res = await axiosInstance.get("/projects", { params });
      return res.data;
    },
  });

export const useGetProjectById = (id: string) =>
  useQuery({
    queryKey: ["/projects", id],
    queryFn: async (): Promise<Project> => {
      const res = await axiosInstance.get(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProject): Promise<Project> => {
      const res = await axiosInstance.post("/projects", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/projects/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/projects/all"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProject }): Promise<Project> => {
      const res = await axiosInstance.patch(`/projects/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/projects/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/projects/all"] });
      queryClient.invalidateQueries({ queryKey: ["/projects", variables.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/projects/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/projects/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/projects/all"] });
    },
  });
};
