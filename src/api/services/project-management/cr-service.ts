import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type CRStatus =
  | "Draft" | "Submitted" | "Under Review" | "Approved"
  | "Rejected" | "In Development" | "Testing" | "Completed" | "Closed";

export type CRPriority = "Critical" | "High" | "Medium" | "Low";

export type CRType =
  | "Enhancement" | "New Feature" | "Modification" | "Integration"
  | "UI/UX Change" | "Data Change" | "Bug Fix" | "Other";

export interface CRAssignee {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface CRAttachment {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

export interface CRTimelineEvent {
  _id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: CRAssignee | string;
  note: string | null;
  changedAt: string;
}

export interface ChangeRequest extends GlobalRecords {
  crNumber: string;
  project: string;
  title: string;
  crType: CRType;
  priority: CRPriority;
  status: CRStatus;
  requestedBy: string | null;
  requestedDate: string;
  targetReleaseDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  estimatedCost: number | null;
  assignedProjectManager: CRAssignee | null;
  assignedDevelopers: CRAssignee[];
  description: string | null;
  businessJustification: string | null;
  technicalApproach: string | null;
  impactAnalysis: string | null;
  dependencies: string | null;
  risks: string | null;
  relatedLinks: { label: string; url: string }[];
  attachments: CRAttachment[];
  timeline: CRTimelineEvent[];
  createdBy: CRAssignee | string;
  order: number;
}

export interface CRStats {
  total: number;
  open: number;
  approved: number;
  inDevelopment: number;
  completed: number;
  rejected: number;
  totalEstimatedHours: number;
  totalActualHours: number;
}

export interface CreateCRPayload {
  title: string;
  crType?: CRType;
  priority?: CRPriority;
  status?: CRStatus;
  requestedBy?: string | null;
  requestedDate?: string | null;
  targetReleaseDate?: string | null;
  estimatedHours?: number | null;
  estimatedCost?: number | null;
  assignedProjectManager?: string | null;
  assignedDevelopers?: string[];
  description?: string | null;
  businessJustification?: string | null;
  technicalApproach?: string | null;
  impactAnalysis?: string | null;
  dependencies?: string | null;
  risks?: string | null;
  relatedLinks?: { label: string; url: string }[];
}

export type UpdateCRPayload = Partial<CreateCRPayload & { actualHours: number | null; statusNote: string; order: number }>;

export interface CRQueryParams {
  search?: string;
  status?: string;
  priority?: string;
  crType?: string;
  limit?: number;
  page?: number;
}

// ──────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────

export const CR_QUERY_KEY = (projectId: string) => ["/crs", projectId] as const;

export const useGetProjectCRs = (projectId: string, params?: CRQueryParams) =>
  useQuery({
    queryKey: [...CR_QUERY_KEY(projectId), params],
    queryFn: async (): Promise<{ data: ChangeRequest[]; totalResults: number }> => {
      const res = await axiosInstance.get(`/projects/${projectId}/crs`, { params: { limit: 200, ...params } });
      return res.data;
    },
    enabled: !!projectId,
  });

export const useGetCRStats = (projectId: string) =>
  useQuery({
    queryKey: ["/crs/stats", projectId],
    queryFn: async (): Promise<CRStats> => {
      const res = await axiosInstance.get(`/projects/${projectId}/crs/stats`);
      return res.data;
    },
    enabled: !!projectId,
  });

export const useGetCRById = (projectId: string, crId: string) =>
  useQuery({
    queryKey: ["/crs", projectId, crId],
    queryFn: async (): Promise<ChangeRequest> => {
      const res = await axiosInstance.get(`/projects/${projectId}/crs/${crId}`);
      return res.data;
    },
    enabled: !!crId,
  });

export const useCreateCR = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCRPayload): Promise<ChangeRequest> => {
      const res = await axiosInstance.post(`/projects/${projectId}/crs`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CR_QUERY_KEY(projectId) });
      qc.invalidateQueries({ queryKey: ["/crs/stats", projectId] });
    },
  });
};

export const useUpdateCR = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ crId, data }: { crId: string; data: UpdateCRPayload }): Promise<ChangeRequest> => {
      const res = await axiosInstance.patch(`/projects/${projectId}/crs/${crId}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CR_QUERY_KEY(projectId) });
      qc.invalidateQueries({ queryKey: ["/crs/stats", projectId] });
    },
  });
};

export const useDeleteCR = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (crId: string) => {
      await axiosInstance.delete(`/projects/${projectId}/crs/${crId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CR_QUERY_KEY(projectId) });
      qc.invalidateQueries({ queryKey: ["/crs/stats", projectId] });
    },
  });
};

export const useUploadCRAttachments = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ crId, files }: { crId: string; files: File[] }): Promise<ChangeRequest> => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await axiosInstance.post(`/projects/${projectId}/crs/${crId}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CR_QUERY_KEY(projectId) }),
  });
};

export const useDeleteCRAttachment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ crId, attachmentId }: { crId: string; attachmentId: string }) => {
      await axiosInstance.delete(`/projects/${projectId}/crs/${crId}/attachments/${attachmentId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CR_QUERY_KEY(projectId) }),
  });
};
