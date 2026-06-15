import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords } from "@/types/global-types";

export type NotificationType = "info" | "warning" | "success" | "error" | "system";
export type NotificationModule = "issues" | "projects" | "crs" | "tasks" | "system";

export interface NotificationSender {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Notification extends GlobalRecords {
  recipient: string;
  sender: NotificationSender | null;
  title: string;
  message: string;
  type: NotificationType;
  module: NotificationModule;
  relatedId: string | null;
  relatedLink: string | null;
  readStatus: boolean;
}

export interface NotificationPaginateResult {
  results: Notification[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  unreadCount: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
}

export const useGetNotifications = (params: NotificationQueryParams = {}) =>
  useQuery({
    queryKey: ["/notifications", params],
    queryFn: async (): Promise<NotificationPaginateResult> => {
      const res = await axiosInstance.get("/notifications", { params });
      return res.data;
    },
  });

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Notification> => {
      const res = await axiosInstance.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await axiosInstance.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axiosInstance.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });
    },
  });
};
