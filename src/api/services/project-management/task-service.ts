import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";

export interface TaskAssignee {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface TaskAttachment {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

export interface RelatedLink {
  label: string;
  url: string;
}

export interface TaskComment {
  _id: string;
  author: { _id: string; name: string; role: string };
  text: string;
  createdAt: string;
}

export interface Task extends GlobalRecords {
  project: string;
  parent: string | null;
  cr: { _id: string; crNumber: string; title: string } | null;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  endDate: string | null;
  assignees: TaskAssignee[];
  dependencies?: any[];
  relatedLinks: RelatedLink[];
  attachments: TaskAttachment[];
  comments?: TaskComment[];
  order: number;
  totalTimeSpent?: number;
}

export interface CreateTaskPayload {
  name: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string | null;
  endDate?: string | null;
  assignees?: string[];
  dependencies?: string[];
  relatedLinks?: RelatedLink[];
  parent?: string | null;
  cr?: string | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

// ──────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────

export const useGetProjectTasks = (projectId: string, enablePolling = false) =>
  useQuery({
    queryKey: ["/tasks", projectId],
    queryFn: async (): Promise<Task[]> => {
      const res = await axiosInstance.get(`/projects/${projectId}/tasks`);
      return res.data;
    },
    enabled: !!projectId,
    refetchInterval: enablePolling ? 15000 : false, // poll every 15s when enabled
  });

export const useCreateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTaskPayload): Promise<Task> => {
      const res = await axiosInstance.post(`/projects/${projectId}/tasks`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/tasks", projectId] }),
  });
};

export const useUpdateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskPayload }): Promise<Task> => {
      const res = await axiosInstance.patch(`/projects/${projectId}/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/tasks", projectId] }),
  });
};

export const useDeleteTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await axiosInstance.delete(`/projects/${projectId}/tasks/${taskId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/tasks", projectId] }),
  });
};

export const useUploadTaskAttachments = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, files }: { taskId: string; files: File[] }): Promise<Task> => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await axiosInstance.post(`/projects/${projectId}/tasks/${taskId}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/tasks", projectId] }),
  });
};

export const useDeleteTaskAttachment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) => {
      await axiosInstance.delete(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/tasks", projectId] }),
  });
};

export const useGetAssignedTasks = (assigneeId?: string) =>
  useQuery({
    queryKey: ["/tasks/assigned", assigneeId],
    queryFn: async (): Promise<Task[]> => {
      const res = await axiosInstance.get(`/tasks`, { params: { assignee: assigneeId } });
      return res.data;
    },
    enabled: !!assigneeId,
  });
