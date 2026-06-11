import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserInfo } from "@/types/global-types";

// ──────────────────────────────────────────────────────────────
// Session Store — Auth tokens + current user
// ──────────────────────────────────────────────────────────────

interface SessionState {
  // Persisted to localStorage
  accessToken: string | null;
  refreshToken: string | null;
  isUserLoggedIn: boolean;

  // NOT persisted — re-fetched on layout mount
  userInfo: UserInfo | null;

  // Actions
  setTokens: (access: string, refresh: string) => void;
  setUserInfo: (info: UserInfo) => void;
  clearSession: () => void;
}

const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isUserLoggedIn: false,
      userInfo: null,

      setTokens: (access, refresh) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          isUserLoggedIn: true,
        }),

      setUserInfo: (info) => set({ userInfo: info }),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isUserLoggedIn: false,
          userInfo: null,
        }),
    }),
    {
      name: "session-store",
      // Only persist tokens — userInfo is re-fetched on mount
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isUserLoggedIn: state.isUserLoggedIn,
      }),
    }
  )
);

export default useSessionStore;
