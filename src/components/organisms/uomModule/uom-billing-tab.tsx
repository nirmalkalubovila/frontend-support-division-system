"use client";

import { useState, useMemo } from "react";
import {
  Button, Badge,
} from "@/components";
import {
  Plus, Settings2, RefreshCw, Lock, LockOpen, Eye,
  Pencil, Trash2, Loader2, TrendingUp, CalendarDays,
  CheckCircle2, AlertCircle, ReceiptText, Layers, Zap,
  CreditCard, Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetUomBaseline,
  useGetUomSnapshots,
  useGenerateSnapshot,
  useDeleteSnapshot,
  useRefreshSnapshotPrices,
} from "@/api/services/finance/uom-service";
import { BaselineFormModal } from "./baseline-form-modal";
import { UpdatePriceModal } from "./update-price-modal";
import { PricingHistoryDrawer } from "./pricing-history-drawer";
import { SnapshotCountsEditor } from "./snapshot-counts-editor";
import { SnapshotDetailDrawer } from "./snapshot-detail-drawer";
import { AllocatePaymentModal } from "@/components/organisms/financeModule/allocate-payment-modal";
import { PaymentHistoryDrawer } from "@/components/organisms/financeModule/payment-history-drawer";
import { PaymentStatusBadge } from "@/components/organisms/financeModule/payment-status-badge";
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import { StatCard } from "@/components/atoms/statCard/statCard";
import { ValidatePermission } from "@/components/atoms/validatePermission";
import type { UomSnapshot, UomType } from "@/types/uom-types";
import type { Payment } from "@/types/finance-types";
import type { UserRole } from "@/types/global-types";
import useSessionStore from "@/store/session-store";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  projectId: string;
}

const CAN_MANAGE: UserRole[] = ["super_admin", "manager"];

// Current month as "YYYY-MM"
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SnapshotStatusChip({ status }: { status: "draft" | "finalized" }) {
  if (status === "finalized") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
        <Lock className="h-2.5 w-2.5" /> Finalised
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
      <LockOpen className="h-2.5 w-2.5" /> Draft
    </span>
  );
}

// Small helper so the hook can be called at component level (not inside map)
function RefreshPricesButton({ projectId, snapshotId }: { projectId: string; snapshotId: string }) {
  const refresh = useRefreshSnapshotPrices(projectId, snapshotId);
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-[var(--primary)]"
      title="Refresh prices from baseline"
      disabled={refresh.isPending}
      onClick={async () => {
        try {
          const result = await refresh.mutateAsync();
          const lastEntry = result?.auditLog?.slice().reverse().find((e: any) => e.action === "count_updated");
          const changed = ((lastEntry?.changes as any)?.pricesRefreshed?.length ?? 0) > 0;
          if (changed) {
            toast.success("Prices updated from current baseline.");
          } else {
            toast.info("Prices are already up to date with the baseline.");
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message ?? "Failed to refresh prices.");
        }
      }}
    >
      {refresh.isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <RefreshCw className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function UomBillingTab({ projectId }: Props) {
  const userInfo = useSessionStore((s) => s.userInfo);
  const userRole = (userInfo?.role ?? "intern") as UserRole;
  const canManage = CAN_MANAGE.includes(userRole);

  const queryClient = useQueryClient();

  // Modal states
  const [baselineModalOpen, setBaselineModalOpen] = useState(false);
  const [pricingUomType, setPricingUomType] = useState<UomType | null>(null);
  const [historyUomType, setHistoryUomType] = useState<UomType | null>(null);
  const [editingSnapshot, setEditingSnapshot] = useState<UomSnapshot | null>(null);
  const [detailSnapshot, setDetailSnapshot] = useState<UomSnapshot | null>(null);
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
  const [allocatePayment, setAllocatePayment] = useState<Payment | null>(null);
  const [historyPayment, setHistoryPayment] = useState<Payment | null>(null);

  // Data
  const { data: baseline, isLoading: baselineLoading } = useGetUomBaseline(projectId);
  const { data: snapshotsData, isLoading: snapshotsLoading } = useGetUomSnapshots(projectId, {
    limit: 24,
    sortBy: "billingMonth:desc",
  });

  const snapshots = snapshotsData?.data ?? [];

  const generateSnapshot = useGenerateSnapshot(projectId);
  const deleteSnapshot = useDeleteSnapshot(projectId);

  const handleGenerate = async () => {
    try {
      await generateSnapshot.mutateAsync({ billingMonth: currentMonth() });
      toast.success("Snapshot generated for " + currentMonth());
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to generate snapshot.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSnapshotId) return;
    try {
      await deleteSnapshot.mutateAsync(deletingSnapshotId);
      toast.success("Snapshot deleted.");
      setDeletingSnapshotId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete.");
    }
  };

  // KPI stats derived from snapshots
  const stats = useMemo(() => {
    const total = snapshots.reduce((s, snap) => s + snap.grandTotal, 0);
    const finalized = snapshots.filter((s) => s.status === "finalized").length;
    const drafts = snapshots.filter((s) => s.status === "draft").length;
    const linked = snapshots.filter((s) => s.linkedPayment).length;
    return { total, finalized, drafts, linked };
  }, [snapshots]);

  const isConfigured = baseline?.isConfigured ?? false;

  return (
    <div className="space-y-6">

      {/* ── Baseline Card ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">UOM Baseline</h3>
            {isConfigured ? (
              <Badge variant="default" className="text-[10px] bg-green-600 border-0 text-white">Configured</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Not configured</Badge>
            )}
          </div>
          <ValidatePermission permission="finance.uom.configure">
            <Button
              size="sm"
              variant={isConfigured ? "outline" : "default"}
              className={`gap-1.5 h-8 ${!isConfigured ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white" : ""}`}
              onClick={() => setBaselineModalOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {isConfigured ? "Edit Baseline" : "Configure Baseline"}
            </Button>
          </ValidatePermission>
        </div>

        {baselineLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-[var(--surface-hover)] animate-pulse" />
            ))}
          </div>
        ) : !isConfigured ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-secondary)]">
            <Layers className="h-8 w-8 opacity-30" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No baseline configured</p>
            <p className="text-xs opacity-70">Add UOM types to enable monthly billing snapshots.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  {["UOM Type", "Default Qty", "Price / Unit (LKR)", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(baseline?.uomTypes ?? []).map((t) => (
                  <tr key={t._id} className={`border-b border-[var(--border)] last:border-0 transition-colors ${t.isActive ? "hover:bg-[var(--surface-hover)]" : "opacity-50"}`}>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{t.defaultCount}</td>
                    <td className="px-4 py-3 font-semibold font-mono text-[var(--text-primary)]">
                      {t.baselinePrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        t.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-[var(--surface-hover)] text-[var(--text-tertiary)] border-[var(--border)]"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${t.isActive ? "bg-green-500" : "bg-[var(--text-tertiary)]"}`} />
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ValidatePermission permission="finance.uom.configure">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Update price"
                            onClick={() => setPricingUomType(t)}
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-[var(--text-secondary)]"
                            title="View pricing history"
                            onClick={() => setHistoryUomType(t)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </ValidatePermission>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Snapshots Section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Monthly Snapshots</h3>
            <Badge variant="secondary" className="text-xs">{snapshots.length}</Badge>
          </div>

          <ValidatePermission permission="finance.uom.snapshot.create">
            <Button
              size="sm"
              className="gap-1.5 h-8 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
              onClick={handleGenerate}
              disabled={!isConfigured || generateSnapshot.isPending}
              title={!isConfigured ? "Configure baseline first" : undefined}
            >
              {generateSnapshot.isPending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
                : <><Plus className="h-3.5 w-3.5" />Generate Snapshot</>}
            </Button>
          </ValidatePermission>
        </div>

        {/* KPI Strip */}
        {snapshots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={ReceiptText} label="Total Billed" value={stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
            <StatCard icon={CheckCircle2} label="Finalised" value={stats.finalized} />
            <StatCard icon={AlertCircle} label="Drafts" value={stats.drafts} />
            <StatCard icon={Zap} label="Linked to Payments" value={stats.linked} />
          </div>
        )}

        {/* Snapshot Table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  {["Snapshot ID", "Billing Month", "Status", "Lines", "Grand Total", "Payment", "Seeded From", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshotsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-[var(--surface-hover)] animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                        <CalendarDays className="h-8 w-8 opacity-30" />
                        <p className="text-sm font-semibold text-[var(--text-primary)]">No snapshots yet</p>
                        <p className="text-xs opacity-70">
                          {isConfigured
                            ? 'Click "Generate Snapshot" to create this month\'s billing snapshot.'
                            : "Configure the UOM baseline first."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snap) => (
                    <tr
                      key={snap._id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                      onClick={() => setDetailSnapshot(snap)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                        {snap.snapshotId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        {snap.billingMonth}
                      </td>
                      <td className="px-4 py-3">
                        <SnapshotStatusChip status={snap.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                        {snap.lines.length}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {snap.grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} LKR
                      </td>
                      <td className="px-4 py-3">
                        {snap.linkedPayment && typeof snap.linkedPayment === "object" ? (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
                              <CheckCircle2 className="h-3 w-3" /> Auto-created
                            </span>
                            <PaymentStatusBadge status={(snap.linkedPayment as Payment).paymentStatus} />
                          </div>
                        ) : snap.linkedPayment ? (
                          <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Auto-created
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-tertiary)]">Pending finalise</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {snap.seededFromPrevious ? "Prev. snapshot" : "Baseline defaults"}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="View details"
                            onClick={() => setDetailSnapshot(snap)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Finalized payment actions */}
                          {snap.status === "finalized" && snap.linkedPayment && typeof snap.linkedPayment === "object" && (
                            <>
                              {(snap.linkedPayment as Payment).paymentStatus !== "Paid" &&
                               (snap.linkedPayment as Payment).paymentStatus !== "Cancelled" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600"
                                  title="Allocate payment"
                                  onClick={() => setAllocatePayment(snap.linkedPayment as Payment)}
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-[var(--text-secondary)]"
                                title="Payment history"
                                onClick={() => setHistoryPayment(snap.linkedPayment as Payment)}
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          <ValidatePermission permission="finance.uom.snapshot.update">
                            {snap.status === "draft" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="Edit counts"
                                  onClick={() => setEditingSnapshot(snap)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <RefreshPricesButton projectId={projectId} snapshotId={snap._id} />
                              </>
                            )}
                          </ValidatePermission>

                          <ValidatePermission permission="finance.uom.snapshot.delete">
                            {snap.status === "draft" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-[var(--destructive)]"
                                title="Delete snapshot"
                                onClick={() => setDeletingSnapshotId(snap._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </ValidatePermission>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modals / Drawers ──────────────────────────────────────────── */}

      <BaselineFormModal
        projectId={projectId}
        baseline={baseline ?? null}
        open={baselineModalOpen}
        onClose={() => setBaselineModalOpen(false)}
      />

      <UpdatePriceModal
        projectId={projectId}
        uomType={pricingUomType}
        open={!!pricingUomType}
        onClose={() => setPricingUomType(null)}
      />

      <PricingHistoryDrawer
        projectId={projectId}
        uomType={historyUomType}
        open={!!historyUomType}
        onClose={() => setHistoryUomType(null)}
      />

      <SnapshotCountsEditor
        projectId={projectId}
        snapshot={editingSnapshot}
        open={!!editingSnapshot}
        onClose={() => setEditingSnapshot(null)}
      />

      <SnapshotDetailDrawer
        projectId={projectId}
        snapshot={detailSnapshot}
        open={!!detailSnapshot}
        onClose={() => setDetailSnapshot(null)}
        onEdit={() => {
          setEditingSnapshot(detailSnapshot);
          setDetailSnapshot(null);
        }}
        userRole={userRole}
      />

      <ConfirmDialog
        open={!!deletingSnapshotId}
        onOpenChange={(o) => { if (!o) setDeletingSnapshotId(null); }}
        title="Delete Snapshot"
        description="Are you sure you want to delete this draft snapshot? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteSnapshot.isPending}
      />

      <AllocatePaymentModal
        projectId={projectId}
        payment={allocatePayment}
        open={!!allocatePayment}
        onClose={() => {
          setAllocatePayment(null);
          queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
        }}
      />

      <PaymentHistoryDrawer
        projectId={projectId}
        payment={historyPayment}
        open={!!historyPayment}
        onClose={() => setHistoryPayment(null)}
      />
    </div>
  );
}
