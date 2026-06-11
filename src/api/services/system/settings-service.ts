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
