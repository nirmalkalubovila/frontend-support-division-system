import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { PaginateResult } from "@/types/global-types";
import type {
  UomBaseline,
  UomSnapshot,
  ConfigureBaselinePayload,
  UpdateUomPricePayload,
  GenerateSnapshotPayload,
  UpdateSnapshotCountsPayload,
  AddSnapshotOverridePayload,
  PricingHistoryResponse,
} from "@/types/uom-types";

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

const keys = {
  baseline: (projectId: string) => ["/uom/baseline", projectId] as const,
  pricingHistory: (projectId: string, uomTypeId: string) =>
    ["/uom/baseline/pricing-history", projectId, uomTypeId] as const,
  snapshots: (projectId: string, params?: object) =>
    ["/uom/snapshots", projectId, params] as const,
  snapshot: (snapshotId: string) => ["/uom/snapshot", snapshotId] as const,
  snapshotByMonth: (projectId: string, billingMonth: string) =>
    ["/uom/snapshot/month", projectId, billingMonth] as const,
};

// ─────────────────────────────────────────────────────────────
// Baseline Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch (or auto-create) the UOM baseline for a project.
 */
export const useGetUomBaseline = (projectId: string) =>
  useQuery({
    queryKey: keys.baseline(projectId),
    queryFn: async (): Promise<UomBaseline> => {
      const res = await axiosInstance.get(`/projects/${projectId}/uom/baseline`);
      return res.data;
    },
    enabled: !!projectId,
  });

/**
 * Replace all UOM types on the baseline (PUT replaces the entire list).
 */
export const useConfigureBaseline = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConfigureBaselinePayload): Promise<UomBaseline> => {
      const res = await axiosInstance.put(`/projects/${projectId}/uom/baseline`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.baseline(projectId) });
    },
  });
};

/**
 * Update the price for a single UOM type (creates a new versioned record).
 */
export const useUpdateUomPrice = (projectId: string, uomTypeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUomPricePayload): Promise<UomBaseline> => {
      const res = await axiosInstance.patch(
        `/projects/${projectId}/uom/baseline/types/${uomTypeId}/price`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.baseline(projectId) });
      queryClient.invalidateQueries({ queryKey: keys.pricingHistory(projectId, uomTypeId) });
    },
  });
};

/**
 * Get the full pricing history for a UOM type.
 */
export const useGetPricingHistory = (projectId: string, uomTypeId: string | null) =>
  useQuery({
    queryKey: keys.pricingHistory(projectId, uomTypeId ?? ""),
    queryFn: async (): Promise<PricingHistoryResponse> => {
      const res = await axiosInstance.get(
        `/projects/${projectId}/uom/baseline/types/${uomTypeId}/pricing-history`
      );
      return res.data;
    },
    enabled: !!projectId && !!uomTypeId,
  });

// ─────────────────────────────────────────────────────────────
// Snapshot Hooks
// ─────────────────────────────────────────────────────────────

/**
 * List all snapshots for a project.
 */
export const useGetUomSnapshots = (
  projectId: string,
  params?: { status?: string; billingMonth?: string; limit?: number; page?: number }
) =>
  useQuery({
    queryKey: keys.snapshots(projectId, params),
    queryFn: async (): Promise<PaginateResult<UomSnapshot>> => {
      const res = await axiosInstance.get(`/projects/${projectId}/uom/snapshots`, { params });
      return res.data;
    },
    enabled: !!projectId,
  });

/**
 * Get a single snapshot by ID.
 */
export const useGetUomSnapshot = (snapshotId: string | null) =>
  useQuery({
    queryKey: keys.snapshot(snapshotId ?? ""),
    queryFn: async (): Promise<UomSnapshot> => {
      const res = await axiosInstance.get(`/projects/_/uom/snapshots/${snapshotId}`);
      return res.data;
    },
    enabled: !!snapshotId,
  });

/**
 * Get the snapshot for a specific billing month ("YYYY-MM").
 */
export const useGetSnapshotByMonth = (projectId: string, billingMonth: string | null) =>
  useQuery({
    queryKey: keys.snapshotByMonth(projectId, billingMonth ?? ""),
    queryFn: async (): Promise<UomSnapshot> => {
      const res = await axiosInstance.get(
        `/projects/${projectId}/uom/snapshots/month/${billingMonth}`
      );
      return res.data;
    },
    enabled: !!projectId && !!billingMonth,
  });

/**
 * Manually generate a snapshot for a billing month.
 */
export const useGenerateSnapshot = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateSnapshotPayload): Promise<UomSnapshot> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/uom/snapshots/generate`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Update UOM counts in a draft snapshot.
 */
export const useUpdateSnapshotCounts = (projectId: string, snapshotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateSnapshotCountsPayload): Promise<UomSnapshot> => {
      const res = await axiosInstance.patch(
        `/projects/${projectId}/uom/snapshots/${snapshotId}/counts`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.snapshot(snapshotId) });
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Finalise a snapshot (locks it for billing).
 */
export const useFinalizeSnapshot = (projectId: string, snapshotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data?: { notes?: string }): Promise<UomSnapshot> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/uom/snapshots/${snapshotId}/finalize`,
        data ?? {}
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.snapshot(snapshotId) });
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Unlock a finalised snapshot (manager only).
 */
export const useUnlockSnapshot = (projectId: string, snapshotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reason: string }): Promise<UomSnapshot> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/uom/snapshots/${snapshotId}/unlock`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.snapshot(snapshotId) });
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Add a post-lock override entry to a finalised snapshot.
 */
export const useAddSnapshotOverride = (projectId: string, snapshotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddSnapshotOverridePayload): Promise<UomSnapshot> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/uom/snapshots/${snapshotId}/overrides`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.snapshot(snapshotId) });
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Link an existing payment to a snapshot.
 */
export const useLinkPaymentToSnapshot = (projectId: string, snapshotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { paymentId: string }): Promise<UomSnapshot> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/uom/snapshots/${snapshotId}/link-payment`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.snapshot(snapshotId) });
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Refresh prices on a draft snapshot to match current baseline pricing.
 */
export const useRefreshSnapshotPrices = (projectId: string, snapshotId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<UomSnapshot> => {
      const res = await axiosInstance.post(
        `/projects/${projectId}/uom/snapshots/${snapshotId}/refresh-prices`
      );
      return res.data;
    },
    onSuccess: (updatedSnapshot) => {
      // Directly update the snapshot in the cache so the table reflects new prices immediately
      queryClient.setQueryData(keys.snapshot(snapshotId), updatedSnapshot);
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
    },
  });
};

/**
 * Soft-delete a draft snapshot.
 */
export const useDeleteSnapshot = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (snapshotId: string): Promise<void> => {
      await axiosInstance.delete(`/projects/${projectId}/uom/snapshots/${snapshotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId] });
    },
  });
};
