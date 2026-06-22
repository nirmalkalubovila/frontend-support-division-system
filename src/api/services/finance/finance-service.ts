import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { PaginateResult } from "@/types/global-types";
import type {
  Payment,
  CreatePaymentPayload,
  AllocatePaymentPayload,
  PaymentTransactionHistory,
  FinanceKPIs,
  ProjectWithFinance,
} from "@/types/finance-types";

export const useFinanceKPIs = () =>
  useQuery({
    queryKey: ["/finance/kpis"],
    queryFn: async (): Promise<FinanceKPIs> => {
      const res = await axiosInstance.get("/finance/kpis");
      return res.data;
    },
  });

export const useAllProjectsFinance = (params?: {
  client?: string;
  search?: string;
  paymentStatus?: string;
  isActive?: boolean;
}) =>
  useQuery({
    queryKey: ["/finance/projects", params],
    queryFn: async (): Promise<ProjectWithFinance[]> => {
      const res = await axiosInstance.get("/finance/projects", { params });
      return res.data;
    },
  });

export const useProjectPayments = (
  projectId: string,
  params?: { limit?: number; page?: number; paymentStatus?: string; paymentType?: string }
) =>
  useQuery({
    queryKey: ["/payments", projectId, params],
    queryFn: async (): Promise<PaginateResult<Payment>> => {
      const res = await axiosInstance.get(`/projects/${projectId}/payments`, { params });
      return res.data;
    },
    enabled: !!projectId,
  });

export const useProjectFinanceSummary = (projectId: string) =>
  useQuery({
    queryKey: ["/payments/summary", projectId],
    queryFn: async (): Promise<import("@/types/finance-types").ProjectFinanceSummary> => {
      const res = await axiosInstance.get(`/projects/${projectId}/payments/summary`);
      return res.data;
    },
    enabled: !!projectId,
  });

export const useCreatePayment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePaymentPayload): Promise<Payment> => {
      const fd = new FormData();
      const { attachment, ...rest } = data;
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (attachment instanceof File) fd.append("attachment", attachment);
      const res = await axiosInstance.post(`/projects/${projectId}/payments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/payments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/finance/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/finance/projects"] });
    },
  });
};

export const useUpdatePayment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: Partial<CreatePaymentPayload>;
    }): Promise<Payment> => {
      const fd = new FormData();
      const { attachment, ...rest } = data;
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (attachment instanceof File) fd.append("attachment", attachment);
      const res = await axiosInstance.patch(
        `/projects/${projectId}/payments/${paymentId}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/payments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/finance/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/finance/projects"] });
    },
  });
};

export const useDeletePayment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      await axiosInstance.delete(`/projects/${projectId}/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/payments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/finance/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/finance/projects"] });
    },
  });
};

export const useAllocatePayment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: AllocatePaymentPayload;
    }): Promise<Payment> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/payments/${paymentId}/allocate`,
        data
      );
      return res.data;
    },
    onSuccess: (_, { paymentId }) => {
      queryClient.invalidateQueries({ queryKey: ["/payments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/payments/summary", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/payment/transactions", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["/finance/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/finance/projects"] });
    },
  });
};

export const usePaymentTransactions = (projectId: string, paymentId: string | null) =>
  useQuery({
    queryKey: ["/payment/transactions", paymentId],
    queryFn: async (): Promise<PaymentTransactionHistory> => {
      const res = await axiosInstance.get(
        `/projects/${projectId}/payments/${paymentId}/transactions`
      );
      return res.data;
    },
    enabled: !!projectId && !!paymentId,
  });
