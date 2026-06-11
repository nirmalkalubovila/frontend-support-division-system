import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

// ──────────────────────────────────────────────────────────────
// Main API Axios Instance
// ──────────────────────────────────────────────────────────────

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ─────────────────────────────────────
// Attach access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("session-store");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const token = parsed?.state?.accessToken;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // localStorage corrupted — ignore
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Separate instance for token refresh (avoids interceptor loops) ──
const authInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Response Interceptor ────────────────────────────────────
// Handle 401 (token expired) and 403 (forbidden)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 403 — show warning but don't redirect
    if (error.response?.status === 403) {
      // Sonner toast will be handled at the component level
      return Promise.reject(error);
    }

    // 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = localStorage.getItem("session-store");
        const parsed = stored ? JSON.parse(stored) : null;
        const refreshToken = parsed?.state?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const { data } = await authInstance.post("/auth/refresh-tokens", {
          refreshToken,
        });

        const newAccessToken = data.access.token;
        const newRefreshToken = data.refresh.token;

        // Update Zustand persisted store
        const currentState = parsed?.state || {};
        const updated = {
          ...parsed,
          state: {
            ...currentState,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        };
        localStorage.setItem("session-store", JSON.stringify(updated));

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear auth state and redirect to login
        localStorage.removeItem("session-store");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
