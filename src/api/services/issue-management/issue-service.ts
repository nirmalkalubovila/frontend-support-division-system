import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords, PaginateResult, IssueStatus } from "@/types/global-types";
import type { Client } from "../project-management/client-service";
import type { Project } from "../project-management/project-service";

// ──────────────────────────────────────────────────────────────
// Issue Types
// ──────────────────────────────────────────────────────────────

export type IssuePriority = "Critical" | "High" | "Medium" | "Low";
export type IssueType = string;

export interface IssueAssignee {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface IssueAttachment {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Issue extends GlobalRecords {
  issueId: string;
  title: string;
  description: string;
  client: Client | string;
  project: Project | string;
  priority: IssuePriority;
  type: IssueType;
  status: string;
  assignedTo: IssueAssignee | string | null;
  createdBy: IssueAssignee | string;
  technicalApproach: string | null;
  estimatedHours: number | null;
  dueDate: string;
  attachments: IssueAttachment[];
}

export interface CreateIssue {
  title: string;
  description: string;
  client: string;
  project: string;
  priority?: IssuePriority;
  type?: IssueType;
  assignedTo?: string | null;
  estimatedHours?: number | null;
}

export interface UpdateIssue {
  title?: string;
  description?: string;
  priority?: IssuePriority;
  type?: IssueType;
  status?: string;
  assignedTo?: string | null;
  estimatedHours?: number | null;
  technicalApproach?: string | null;
}

export interface IssueQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  client?: string;
  project?: string;
  priority?: string;
  type?: string;
  status?: string;
  assignedTo?: string;
  sortBy?: string;
}

// ──────────────────────────────────────────────────────────────
// Issue API Service Hooks
// ──────────────────────────────────────────────────────────────

export const useGetIssues = (params: IssueQueryParams) =>
  useQuery({
    queryKey: ["/issues", params],
    queryFn: async (): Promise<PaginateResult<Issue>> => {
      const res = await axiosInstance.get("/issues", { params });
      return res.data;
    },
  });

export const useGetIssueById = (id: string) =>
  useQuery({
    queryKey: ["/issues", id],
    queryFn: async (): Promise<Issue> => {
      const res = await axiosInstance.get(`/issues/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateIssue): Promise<Issue> => {
      const res = await axiosInstance.post("/issues", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIssue }): Promise<Issue> => {
      const res = await axiosInstance.patch(`/issues/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/issues", variables.id] });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/issues/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};

export const useUploadAttachments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, files }: { issueId: string; files: File[] }): Promise<Issue> => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await axiosInstance.post(`/issues/${issueId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, attachmentId }: { issueId: string; attachmentId: string }) => {
      const res = await axiosInstance.delete(`/issues/${issueId}/attachments/${attachmentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/issues"] });
    },
  });
};
