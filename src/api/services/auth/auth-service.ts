import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import useSessionStore from "@/store/session-store";
import type { LoginResponse, UserInfo } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// Auth API Service Hooks
// ──────────────────────────────────────────────────────────────

// ── Login ──────────────────────────────────────────────────────
interface LoginPayload {
  email: string;
  password: string;
}

export const useLogin = () => {
  const setTokens = useSessionStore((s) => s.setTokens);
  const setUserInfo = useSessionStore((s) => s.setUserInfo);

  return useMutation({
    mutationFn: async (data: LoginPayload): Promise<LoginResponse> => {
      const res = await axiosInstance.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      setTokens(data.tokens.access.token, data.tokens.refresh.token);
      setUserInfo(data.user);
    },
  });
};

// ── Get Current User (/auth/me) ────────────────────────────────
export const useGetMe = () => {
  const isLoggedIn = useSessionStore((s) => s.isUserLoggedIn);
  const setUserInfo = useSessionStore((s) => s.setUserInfo);

  const query = useQuery({
    queryKey: ["/auth/me"],
    queryFn: async (): Promise<UserInfo> => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
    enabled: isLoggedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (query.data) {
      setUserInfo(query.data);
    }
  }, [query.data, setUserInfo]);

  return query;
};

// ── Logout ─────────────────────────────────────────────────────
export const useLogout = () => {
  const clearSession = useSessionStore((s) => s.clearSession);
  const refreshToken = useSessionStore((s) => s.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await axiosInstance.post("/auth/logout", { refreshToken });
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};

// ── Forgot Password ────────────────────────────────────────────
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      return res.data;
    },
  });
};

// ── Reset Password ─────────────────────────────────────────────
interface ResetPasswordPayload {
  token: string;
  password: string;
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordPayload) => {
      const res = await axiosInstance.post("/auth/reset-password", data);
      return res.data;
    },
  });
};

// ── Update Profile (PATCH /auth/me) ───────────────────────────
interface UpdateProfilePayload {
  name?: string;
  phone?: string | null;
  designation?: string | null;
  avatar?: string | null;
}

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  const setUserInfo = useSessionStore((s) => s.setUserInfo);

  return useMutation({
    mutationFn: async (data: UpdateProfilePayload): Promise<UserInfo> => {
      const res = await axiosInstance.patch("/auth/me", data);
      return res.data;
    },
    onSuccess: (data) => {
      setUserInfo(data);
      queryClient.setQueryData(["/auth/me"], data);
    },
  });
};

// ── Change Password (PATCH /auth/me/change-password) ─────────
interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordPayload): Promise<void> => {
      await axiosInstance.patch("/auth/me/change-password", data);
    },
  });
};
