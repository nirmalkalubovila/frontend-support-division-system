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

export interface MainContact {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Project extends GlobalRecords {
  name: string;
  client: Client | string | null;
  contractType: "Monthly Retainer" | "Per-Incident" | "Time & Material" | "Fixed" | null;
  allocatedHours: number;
  usedHours: number;
  members: ProjectMember[] | string[];
  isActive: boolean;
  description?: string | null;
  photo?: string | null;
  completion: number;
  startDate?: string | null;
  endDate?: string | null;
  projectType: ("New Development" | "CR" | "Support")[];
  /** @deprecated use mainContacts */
  mainContact?: MainContact;
  mainContacts: MainContact[];
  techStack: string[];
  stage?: 'development' | 'support';
}

export interface CreateProjectPayload {
  name: string;
  client?: string | null;
  contractType?: string | null;
  allocatedHours?: number;
  members?: string[];
  description?: string | null;
  photo?: File | null;
  completion?: number;
  startDate?: string | null;
  endDate?: string | null;
  projectType?: string[];
  mainContacts?: MainContact[];
  techStack?: string[];
  stage?: 'development' | 'support';
}

export type UpdateProjectPayload = Partial<CreateProjectPayload> & { isActive?: boolean };

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function toFormData(data: CreateProjectPayload | UpdateProjectPayload): FormData {
  const fd = new FormData();
  const { photo, projectType, techStack, members, mainContact, mainContacts, stage, ...rest } = data as any;

  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  });

  if (photo instanceof File) fd.append("photo", photo);
  if (projectType) fd.append("projectType", JSON.stringify(projectType));
  if (techStack) fd.append("techStack", JSON.stringify(techStack));
  if (members) fd.append("members", JSON.stringify(members));
  if (mainContacts) fd.append("mainContacts", JSON.stringify(mainContacts));
  if (stage) fd.append("stage", stage);

  return fd;
}

// ──────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────

export const usePaginateProjects = (params: PaginationRequest & { client?: string; isActive?: boolean }) =>
  useQuery({
    queryKey: ["/projects/paginate", params.page, params.limit, params.search, params.client, params.isActive],
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
    mutationFn: async (data: CreateProjectPayload): Promise<Project> => {
      const res = await axiosInstance.post("/projects", toFormData(data), {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectPayload }): Promise<Project> => {
      const res = await axiosInstance.patch(`/projects/${id}`, toFormData(data), {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
