import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { GlobalRecords, PaginateResult, PaginationRequest } from "@/types/global-types";
import type { UserRole } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// User Types
// ──────────────────────────────────────────────────────────────

export interface User extends GlobalRecords {
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  isActive: boolean;
  phone?: string;
  designation?: string;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  designation?: string;
}

export interface UpdateUser {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  designation?: string;
  isActive?: boolean;
  permissions?: string[];
}

// ──────────────────────────────────────────────────────────────
// User API Service Hooks
// ──────────────────────────────────────────────────────────────

export const usePaginateUsers = (params: PaginationRequest) =>
  useQuery({
    queryKey: ["/users/paginate", params.page, params.limit, params.search],
    queryFn: async (): Promise<PaginateResult<User>> => {
      const res = await axiosInstance.get("/users/paginate", { params });
      return res.data;
    },
  });

export const useGetUserById = (id: string) =>
  useQuery({
    queryKey: ["/users", id],
    queryFn: async (): Promise<User> => {
      const res = await axiosInstance.get(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

export const useGetAllUsers = () =>
  useQuery({
    queryKey: ["/users/all"],
    queryFn: async (): Promise<User[]> => {
      const res = await axiosInstance.get("/users/all");
      return res.data;
    },
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUser): Promise<User> => {
      const res = await axiosInstance.post("/users/create", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/users/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/users/all"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUser }): Promise<User> => {
      const res = await axiosInstance.patch(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/users/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/users/all"] });
      queryClient.invalidateQueries({ queryKey: ["/users", variables.id] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/users/paginate"] });
      queryClient.invalidateQueries({ queryKey: ["/users/all"] });
    },
  });
};
