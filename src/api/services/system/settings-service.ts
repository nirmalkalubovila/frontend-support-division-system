import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export interface BrandingSettings {
  companyName: string;
  slogan: string;
  primaryColor: string;
  logoUrl: string;
}

export const useGetBranding = () =>
  useQuery({
    queryKey: ["/system/branding"],
    queryFn: async (): Promise<BrandingSettings> => {
      const res = await axiosInstance.get("/system/branding");
      return res.data;
    },
  });

export const useUpdateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BrandingSettings>): Promise<BrandingSettings> => {
      const res = await axiosInstance.patch("/system/branding", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/system/branding"], data);
      queryClient.invalidateQueries({ queryKey: ["/system/branding"] });
    },
  });
};

export const useUploadLogo = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ logoUrl: string }> => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await axiosInstance.post("/system/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
  });
};

export interface PrioritySla {
  firstResponse: number; // in minutes
  resolution: number; // in minutes
  escalation: number; // in minutes
}

export interface PrioritiesSettings {
  Critical: PrioritySla;
  High: PrioritySla;
  Medium: PrioritySla;
  Low: PrioritySla;
}

export const useGetPriorities = () =>
  useQuery({
    queryKey: ["/system/priorities"],
    queryFn: async (): Promise<PrioritiesSettings> => {
      const res = await axiosInstance.get("/system/priorities");
      return res.data;
    },
  });

export const useUpdatePriorities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PrioritiesSettings): Promise<PrioritiesSettings> => {
      const res = await axiosInstance.patch("/system/priorities", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/system/priorities"], data);
      queryClient.invalidateQueries({ queryKey: ["/system/priorities"] });
    },
  });
};

export const useGetCategories = () =>
  useQuery({
    queryKey: ["/system/categories"],
    queryFn: async (): Promise<string[]> => {
      const res = await axiosInstance.get("/system/categories");
      return res.data;
    },
  });

export const useUpdateCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categories: string[]): Promise<string[]> => {
      const res = await axiosInstance.patch("/system/categories", { categories });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/system/categories"], data);
      queryClient.invalidateQueries({ queryKey: ["/system/categories"] });
    },
  });
};

export interface NotificationSettings {
  emailCritical: boolean;
  inAppSlaBreach: boolean;
  dailySummary: boolean;
  projectHourWarning: boolean;
}

export const useGetNotifications = () =>
  useQuery({
    queryKey: ["/system/notifications"],
    queryFn: async (): Promise<NotificationSettings> => {
      const res = await axiosInstance.get("/system/notifications");
      return res.data;
    },
  });

export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
      const res = await axiosInstance.patch("/system/notifications", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/system/notifications"], data);
      queryClient.invalidateQueries({ queryKey: ["/system/notifications"] });
    },
  });
};

export interface FinanceSettings {
  defaultContractedHourlyRate: number;
}

export const useGetFinanceSettings = () =>
  useQuery({
    queryKey: ["/system/finance-settings"],
    queryFn: async (): Promise<FinanceSettings> => {
      const res = await axiosInstance.get("/system/finance-settings");
      return res.data;
    },
  });

export const useUpdateFinanceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FinanceSettings): Promise<FinanceSettings> => {
      const res = await axiosInstance.patch("/system/finance-settings", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/system/finance-settings"], data);
      queryClient.invalidateQueries({ queryKey: ["/system/finance-settings"] });
    },
  });
};

