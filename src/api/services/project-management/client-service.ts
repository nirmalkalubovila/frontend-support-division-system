import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords, PaginateResult, PaginationRequest } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// Client Types
// ──────────────────────────────────────────────────────────────

export interface Client extends GlobalRecords {
  name: string;
  code: string;
  contactEmail: string | null;
  isActive: boolean;
}

export interface CreateClient {
  name: string;
  code: string;
  contactEmail?: string;
}

export interface UpdateClient {
  name?: string;
  contactEmail?: string;
  isActive?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Client API Service Hooks
// ──────────────────────────────────────────────────────────────

export const usePaginateClients = (params: PaginationRequest) =>
  useQuery({
    queryKey: ["/clients/paginate", params.page, params.limit, params.search],
    queryFn: async (): Promise<PaginateResult<Client>> => {
      const res = await axiosInstance.get("/clients", { params });
      return res.data;
    },
  });

export const useGetAllClients = () =>
  useQuery({
    queryKey: ["/clients/all"],
    queryFn: async (): Promise<PaginateResult<Client>> => {
      const res = await axiosInstance.get("/clients", { params: { limit: 200 } });
      return res.data;
    },
  });

export const useGetClientById = (id: string) =>
  useQuery({
    queryKey: ["/clients", id],
    queryFn: async (): Promise<Client> => {
      const res = await axiosInstance.get(`/clients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClient): Promise<Client> => {
      const res = await axiosInstance.post("/clients", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/clients/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/clients/all"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClient }): Promise<Client> => {
      const res = await axiosInstance.patch(`/clients/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/clients/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/clients/all"] });
      queryClient.invalidateQueries({ queryKey: ["/clients", variables.id] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/clients/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/clients/all"] });
    },
  });
};
