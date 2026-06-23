"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button,
} from "@/components";
import {
  CheckCircle2, Lock, LockOpen, ShieldAlert,
  Loader2, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, RefreshCw, Zap, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFinalizeSnapshot,
  useUnlockSnapshot,
  useRefreshSnapshotPrices,
} from "@/api/services/finance/uom-service";
import { SnapshotOverrideModal } from "./snapshot-override-modal";
import type { UomSnapshot } from "@/types/uom-types";
import type { UserRole } from "@/types/global-types";

interface Props {
  projectId: string;
  snapshot: UomSnapshot | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  userRole: UserRole;
}

const CAN_MANAGE: UserRole[] = ["super_admin", "manager"];

function StatusChip({ status }: { status: "draft" | "finalized" }) {
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

function DiffBadge({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return <span className="text-[10px] text-[var(--text-tertiary)]">—</span>;
  const delta = current - previous;
  if (delta === 0) return <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]"><Minus className="h-2.5 w-2.5" /></span>;
  if (delta > 0) return <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600"><TrendingUp className="h-2.5 w-2.5" />+{delta}</span>;
  return <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-500"><TrendingDown className="h-2.5 w-2.5" />{delta}</span>;
}

export function SnapshotDetailDrawer({
  projectId, snapshot, open, onClose, onEdit, userRole,
}: Props) {
  const [showOverride, setShowOverride] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [showUnlockInput, setShowUnlockInput] = useState(false);

  const canManage = CAN_MANAGE.includes(userRole);

  const finalize = useFinalizeSnapshot(projectId, snapshot?._id ?? "");
  const unlock = useUnlockSnapshot(projectId, snapshot?._id ?? "");
  const refreshPrices = useRefreshSnapshotPrices(projectId, snapshot?._id ?? "");

  const handleRefreshPrices = async () => {
    try {
      const result = await refreshPrices.mutateAsync();
      // Check audit log to see if prices actually changed
      const lastEntry = result?.auditLog?.slice().reverse().find((e: any) => e.action === "count_updated");
      const changed = lastEntry?.changes?.pricesRefreshed?.length > 0;
      if (changed) {
        toast.success("Prices updated from current baseline.");
      } else {
        toast.info("Prices are already up to date with the baseline.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to refresh prices.");
    }
  };

  const handleFinalize = async () => {
    if (!snapshot) return;
    try {
      await finalize.mutateAsync({});
      toast.success("Snapshot finalised. A payment record has been auto-created in the Payments tab.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to finalise.");
    }
  };

  const handleUnlock = async () => {
    if (!unlockReason.trim()) {
      toast.error("A reason is required to unlock.");
      return;
    }
    try {
      await unlock.mutateAsync({ reason: unlockReason });
      toast.success("Snapshot unlocked. The auto-generated payment was cancelled and will be recreated on re-finalisation.");
      setShowUnlockInput(false);
      setUnlockReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to unlock.");
    }
  };

  if (!snapshot) return null;

  const isDraft = snapshot.status === "draft";
  const isFinalized = snapshot.status === "finalized";

  // Find the payment_created audit entry to get the auto-payment ID for display
  const paymentCreatedEntry = snapshot.auditLog
    .slice()
    .reverse()
    .find((e) => e.action === "payment_created");

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-3 border-b border-[var(--border)] shrink-0">
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{snapshot.snapshotId}</span>
              <span className="font-bold">{snapshot.billingMonth}</span>
              <StatusChip status={snapshot.status} />
              {snapshot.seededFromPrevious && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] text-[var(--primary)]">
                  Auto-seeded
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">

            {/* ── Action bar ───────────────────────────────────────────── */}
            {canManage && (
              <div className="flex flex-wrap gap-2">
                {isDraft && (
                  <>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={onEdit}>
                      Edit Counts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-[var(--primary)] border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.06)]"
                      onClick={handleRefreshPrices}
                      disabled={refreshPrices.isPending}
                      title="Re-apply latest baseline prices to this snapshot"
                    >
                      {refreshPrices.isPending
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Refreshing…</>
                        : <><RefreshCw className="h-3.5 w-3.5" />Refresh Prices</>}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 h-8 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleFinalize}
                      disabled={finalize.isPending}
                    >
                      {finalize.isPending
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Finalising…</>
                        : <><CheckCircle2 className="h-3.5 w-3.5" />Finalise & Create Payment</>}
                    </Button>
                  </>
                )}
                {isFinalized && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => setShowOverride(true)}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Add Override
                    </Button>
                    {!showUnlockInput ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        onClick={() => setShowUnlockInput(true)}
                      >
                        <LockOpen className="h-3.5 w-3.5" />
                        Unlock
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                          placeholder="Reason for unlocking…"
                          value={unlockReason}
                          onChange={(e) => setUnlockReason(e.target.value)}
                        />
                        <Button size="sm" variant="outline" className="h-8" onClick={handleUnlock} disabled={unlock.isPending}>
                          {unlock.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowUnlockInput(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Auto-payment status strip ─────────────────────────── */}
            {isFinalized && snapshot.linkedPayment && (
              <div className="flex items-center gap-3 rounded-lg bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.2)] px-4 py-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[rgba(99,102,241,0.1)] shrink-0">
                  <Zap className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Payment auto-created
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    A <span className="font-semibold text-[var(--primary)]">UOM Based</span> payment record was automatically created in the Payments tab.
                    Allocate payments against it there.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--primary)]">
                    LKR {snapshot.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                    <CreditCard className="h-3 w-3 text-[var(--text-tertiary)]" />
                    <span className="text-[10px] text-[var(--text-tertiary)]">View in Payments tab</span>
                  </div>
                </div>
              </div>
            )}

            {/* Draft info hint */}
            {isDraft && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Once finalised, a <strong>UOM Based payment record</strong> will be automatically created in the Payments tab for{" "}
                  <strong>LKR {snapshot.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
                  You can then allocate received amounts against it.
                </span>
              </div>
            )}

            {/* ── UOM Lines table ───────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="grid grid-cols-[1fr_70px_70px_70px_80px_100px] gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-hover)]">
                {["UOM Type", "Prev", "Count", "Diff", "Price/Unit", "Line Total"].map((h) => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{h}</span>
                ))}
              </div>

              {snapshot.lines.map((line) => {
                const hasChange = line.previousCount !== null && line.count !== line.previousCount;
                return (
                  <div
                    key={line.uomTypeId}
                    className={`grid grid-cols-[1fr_70px_70px_70px_80px_100px] gap-2 items-center px-4 py-3 border-b border-[var(--border)] last:border-0 transition-colors ${
                      hasChange ? "bg-[rgba(99,102,241,0.03)]" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{line.name}</p>
                      {line.isManuallyEdited && (
                        <span className="text-[9px] font-bold text-[var(--primary)] bg-[rgba(99,102,241,0.1)] px-1.5 py-0.5 rounded">
                          Edited
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-mono text-[var(--text-secondary)]">{line.previousCount ?? "—"}</span>
                    <span className={`text-sm font-semibold font-mono ${hasChange ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                      {line.count}
                    </span>
                    <DiffBadge current={line.count} previous={line.previousCount} />
                    <span className="text-xs text-[var(--text-secondary)]">
                      LKR {line.pricePerUnit.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-right text-[var(--text-primary)]">
                      {line.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}

              {/* Grand total row */}
              <div className="grid grid-cols-[1fr_70px_70px_70px_80px_100px] gap-2 items-center px-4 py-3 bg-[var(--surface-hover)] border-t border-[var(--border)]">
                <span className="col-span-5 text-sm font-bold text-[var(--text-primary)] text-right pr-2">Grand Total</span>
                <span className="text-base font-bold text-[var(--primary)] text-right">
                  {snapshot.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* ── Overrides ─────────────────────────────────────────── */}
            {snapshot.overrides.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Override Entries ({snapshot.overrides.length})
                </p>
                {snapshot.overrides.map((ov) => (
                  <div key={ov._id} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-800">{ov.uomTypeName}</span>
                      <span className="text-[10px] text-amber-600">{new Date(ov.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-amber-600">Count</span>
                        <p className="font-mono">{ov.previousCount} → <span className="font-bold">{ov.newCount}</span></p>
                      </div>
                      <div>
                        <span className="text-amber-600">Price/Unit</span>
                        <p className="font-mono">{ov.previousPricePerUnit} → <span className="font-bold">{ov.newPricePerUnit}</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 italic">{ov.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Audit log (collapsible) ───────────────────────────── */}
            <div>
              <button
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setShowAudit((v) => !v)}
              >
                {showAudit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Audit Log ({snapshot.auditLog.length})
              </button>

              {showAudit && (
                <div className="mt-3 space-y-2">
                  {[...snapshot.auditLog].reverse().map((entry) => (
                    <div
                      key={entry._id}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-xs ${
                        entry.action === "payment_created"
                          ? "border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.04)]"
                          : entry.action === "payment_voided"
                          ? "border-red-200 bg-red-50"
                          : "border-[var(--border)] bg-[var(--surface-hover)]"
                      }`}
                    >
                      <span className={`capitalize font-semibold shrink-0 mt-0.5 ${
                        entry.action === "payment_created" ? "text-[var(--primary)]"
                        : entry.action === "payment_voided" ? "text-red-600"
                        : "text-[var(--primary)]"
                      }`}>
                        {entry.action.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 min-w-0">
                        {entry.notes && <p className="text-[var(--text-secondary)] italic truncate">{entry.notes}</p>}
                      </div>
                      <span className="text-[var(--text-tertiary)] whitespace-nowrap shrink-0">
                        {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SnapshotOverrideModal
        projectId={projectId}
        snapshot={showOverride ? snapshot : null}
        open={showOverride}
        onClose={() => setShowOverride(false)}
      />
    </>
  );
}
