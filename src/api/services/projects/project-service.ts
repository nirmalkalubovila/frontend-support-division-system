import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

// ──────────────────────────────────────────────────────────────
// Project API Service Hooks
// ──────────────────────────────────────────────────────────────

export interface ProjectPayload {
  name: string;
  client?: string;
  clientContact?: string;
  status?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  projectTypes?: string[];
  photoUrl?: string;
}

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectPayload) => {
      const res = await axiosInstance.post("/projects", data);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate projects to refetch
      queryClient.invalidateQueries({ queryKey: ["/projects"] });
    },
  });
};

export const useGetProjects = (params?: any) => {
  return useQuery({
    queryKey: ["/projects", params],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects", { params });
      return res.data;
    },
  });
};

export const useGetProjectById = (projectId: string) => {
  return useQuery({
    queryKey: ["/projects", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });
};
