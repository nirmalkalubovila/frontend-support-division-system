"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Input, Label, Select, Textarea,
} from "@/components";
import {
  CheckCircle2, Lock, LockOpen, ShieldAlert,
  Loader2, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, RefreshCw, Zap, CreditCard, Clock,
  ArrowLeft, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useFinalizeSnapshot,
  useUnlockSnapshot,
  useRefreshSnapshotPrices,
} from "@/api/services/finance/uom-service";
import {
  useAllocatePayment,
  usePaymentTransactions,
} from "@/api/services/finance/finance-service";
import { SnapshotOverrideModal } from "./snapshot-override-modal";
import { PaymentStatusBadge } from "@/components/organisms/financeModule/payment-status-badge";
import type { UomSnapshot } from "@/types/uom-types";
import type { Payment, PaymentMethod, PaymentStatus, AllocatePaymentPayload } from "@/types/finance-types";
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

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  // View mode
  const [viewMode, setViewMode] = useState<"details" | "finalize" | "allocate" | "history">("details");

  // Allocate payment form states
  const [allocateAmount, setAllocateAmount] = useState(0);
  const [allocateMethod, setAllocateMethod] = useState<PaymentMethod | null>(null);
  const [allocateDate, setAllocateDate] = useState("");
  const [allocateRef, setAllocateRef] = useState("");
  const [allocateNotes, setAllocateNotes] = useState("");
  const [allocateAmountError, setAllocateAmountError] = useState<string | null>(null);

  // Finalize form states
  const [dueDate, setDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [partiallyPaidAmount, setPartiallyPaidAmount] = useState<number | "">("");
  const [finalizeNotes, setFinalizeNotes] = useState("");
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  const canManage = CAN_MANAGE.includes(userRole);

  const finalize = useFinalizeSnapshot(projectId, snapshot?._id ?? "");
  const unlock = useUnlockSnapshot(projectId, snapshot?._id ?? "");
  const refreshPrices = useRefreshSnapshotPrices(projectId, snapshot?._id ?? "");
  const queryClient = useQueryClient();

  // Extract populated linked payment object (backend populates this)
  const linkedPayment: Payment | null =
    snapshot?.linkedPayment && typeof snapshot.linkedPayment === "object"
      ? (snapshot.linkedPayment as Payment)
      : null;

  // Reset forms on drawer open
  useEffect(() => {
    if (open) {
      setViewMode("details");
      setUnlockReason("");
      setShowUnlockInput(false);
      setShowAudit(false);
      
      setAllocateAmount(0);
      setAllocateMethod(null);
      setAllocateDate("");
      setAllocateRef("");
      setAllocateNotes("");
      setAllocateAmountError(null);

      setDueDate("");
      setPaymentStatus("Pending");
      setPaymentMethod(null);
      setPaymentDate("");
      setReferenceNumber("");
      setPartiallyPaidAmount("");
      setFinalizeNotes("");
      setFinalizeError(null);
    }
  }, [open]);

  const handleRefreshPrices = async () => {
    try {
      const result = await refreshPrices.mutateAsync();
      // Check audit log to see if prices actually changed
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
  };

  const handleFinalizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinalizeError(null);
    if (!snapshot) return;

    const isPartiallyPaid = paymentStatus === "Partially Paid";
    if (isPartiallyPaid && (partiallyPaidAmount === "" || Number(partiallyPaidAmount) <= 0)) {
      setFinalizeError("Partially paid amount must be greater than zero.");
      return;
    }
    if (isPartiallyPaid && Number(partiallyPaidAmount) > snapshot.grandTotal) {
      setFinalizeError("Partially paid amount cannot exceed the grand total.");
      return;
    }

    try {
      const isPaid = paymentStatus === "Paid";
      const needsRef = !!paymentMethod && ["Bank Transfer", "Online Payment"].includes(paymentMethod);
      
      await finalize.mutateAsync({
        dueDate: dueDate || null,
        paymentStatus,
        paymentMethod: paymentStatus === "Pending" ? null : paymentMethod,
        paymentDate: (isPaid || isPartiallyPaid) ? paymentDate || null : null,
        referenceNumber: needsRef ? referenceNumber || null : null,
        notes: finalizeNotes || null,
        partiallyPaidAmount: isPartiallyPaid ? Number(partiallyPaidAmount) : null,
      });

      toast.success("Snapshot finalised. A payment record has been auto-created in the Payments tab.");
      
      setDueDate("");
      setPaymentStatus("Pending");
      setPaymentMethod(null);
      setPaymentDate("");
      setReferenceNumber("");
      setPartiallyPaidAmount("");
      setFinalizeNotes("");
      setFinalizeError(null);

      setViewMode("details");
      onClose();
    } catch (err: any) {
      setFinalizeError(err?.response?.data?.message ?? "Failed to finalise.");
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

  const allocateMutation = useAllocatePayment(projectId);

  const handleAllocateAmountChange = (val: string) => {
    if (!linkedPayment) return;
    const num = parseFloat(val) || 0;
    setAllocateAmount(num);
    const outstanding = parseFloat((linkedPayment.totalAmount - (linkedPayment.partiallyPaidAmount ?? 0)).toFixed(2));
    if (num <= 0) {
      setAllocateAmountError("Amount must be greater than zero");
    } else if (num > outstanding) {
      setAllocateAmountError(`Cannot exceed outstanding balance of LKR ${outstanding.toLocaleString()}`);
    } else {
      setAllocateAmountError(null);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedPayment || allocateAmountError || allocateAmount <= 0) return;

    const outstanding = parseFloat((linkedPayment.totalAmount - (linkedPayment.partiallyPaidAmount ?? 0)).toFixed(2));
    if (allocateAmount > outstanding) return;

    try {
      const payload: AllocatePaymentPayload = {
        amount: allocateAmount,
        paymentMethod: allocateMethod,
        paymentDate: allocateDate || null,
        referenceNumber: allocateMethod && ["Bank Transfer", "Online Payment"].includes(allocateMethod) ? allocateRef || null : null,
        notes: allocateNotes || null,
      };

      await allocateMutation.mutateAsync({ paymentId: linkedPayment._id, data: payload });
      toast.success("Payment allocated successfully.");
      
      setAllocateAmount(0);
      setAllocateMethod(null);
      setAllocateDate("");
      setAllocateRef("");
      setAllocateNotes("");
      setAllocateAmountError(null);

      queryClient.invalidateQueries({ queryKey: ["/uom/snapshots", projectId], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/uom/snapshot"], exact: false });
      
      setViewMode("details");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to allocate payment.");
    }
  };

  const { data: history, isLoading: historyLoading } = usePaymentTransactions(
    projectId,
    viewMode === "history" && linkedPayment ? linkedPayment._id : null
  );
  const transactions = history?.transactions ?? [];
  const historyTotalAmount = history?.totalAmount ?? linkedPayment?.totalAmount ?? snapshot?.grandTotal ?? 0;
  const historyTotalPaid = history?.partiallyPaidAmount ?? linkedPayment?.partiallyPaidAmount ?? 0;
  const historyOutstanding = history?.outstanding ?? (historyTotalAmount - historyTotalPaid);

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
      <Dialog open={open && !showFinalize} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-3 border-b border-[var(--border)] shrink-0">
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {viewMode !== "details" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 mr-1"
                  onClick={() => setViewMode("details")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {viewMode === "details" ? (
                <>
                  <span className="font-mono text-xs text-[var(--text-tertiary)]">{snapshot.snapshotId}</span>
                  <span className="font-bold">{snapshot.billingMonth}</span>
                  <StatusChip status={snapshot.status} />
                  {snapshot.seededFromPrevious && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] text-[var(--primary)] font-medium">
                      Auto-seeded
                    </span>
                  )}
                </>
              ) : viewMode === "finalize" ? (
                "Finalise Snapshot & Create Payment"
              ) : viewMode === "allocate" ? (
                "Allocate Payment"
              ) : (
                "Payment History"
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
            {viewMode === "details" && (
              <>
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
                          onClick={() => setViewMode("finalize")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />Finalise & Create Payment
                        </Button>
                      </>
                    )}
                    {isFinalized && (
                      <>
                        {linkedPayment && linkedPayment.paymentStatus !== "Paid" && linkedPayment.paymentStatus !== "Cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => setViewMode("allocate")}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Allocate Payment
                          </Button>
                        )}
                        {linkedPayment && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8"
                            onClick={() => setViewMode("history")}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Payment History
                          </Button>
                        )}
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
                {isFinalized && linkedPayment && (
                  <div className="flex items-center gap-3 rounded-lg bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.2)] px-4 py-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[rgba(99,102,241,0.1)] shrink-0">
                      <Zap className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          Payment {linkedPayment.paymentId}
                        </p>
                        <PaymentStatusBadge status={linkedPayment.paymentStatus} />
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {linkedPayment.paymentStatus === "Paid"
                          ? "Fully paid — no outstanding balance."
                          : linkedPayment.paymentStatus === "Partially Paid"
                          ? `Received LKR ${(linkedPayment.partiallyPaidAmount ?? 0).toLocaleString()} of LKR ${snapshot.grandTotal.toLocaleString()} — outstanding LKR ${(snapshot.grandTotal - (linkedPayment.partiallyPaidAmount ?? 0)).toLocaleString()}`
                          : "Awaiting payment — use Allocate Payment to record received amounts."}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[var(--primary)]">
                        LKR {snapshot.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {linkedPayment.paymentStatus === "Partially Paid" && (
                        <div className="mt-1 w-24 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${Math.min(100, ((linkedPayment.partiallyPaidAmount ?? 0) / snapshot.grandTotal) * 100)}%` }}
                          />
                        </div>
                      )}
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
              </>
            )}

            {/* ── Finalise Form View ───────────────────────────────────── */}
            {viewMode === "finalize" && (
              <form onSubmit={handleFinalizeSubmit} className="space-y-4 max-w-md mx-auto py-2">
                <div className="rounded-lg bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.2)] px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--primary)]">Total Billed Amount</span>
                  <span className="text-base font-bold text-[var(--primary)]">LKR {snapshot.grandTotal.toLocaleString()}</span>
                </div>

                {finalizeError && (
                  <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {finalizeError}
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Payment Status</Label>
                    <Select
                      options={[
                        { label: "Pending", value: "Pending" },
                        { label: "Paid", value: "Paid" },
                        { label: "Partially Paid", value: "Partially Paid" },
                        { label: "Overdue", value: "Overdue" },
                        { label: "Cancelled", value: "Cancelled" }
                      ]}
                      value={paymentStatus}
                      onChange={(v) => {
                        const s = v as PaymentStatus;
                        setPaymentStatus(s);
                        if (s === "Pending") {
                          setPaymentMethod(null);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment Method</Label>
                    <Select
                      options={[
                        { label: "Select method", value: "" },
                        { label: "Cash", value: "Cash" },
                        { label: "Bank Transfer", value: "Bank Transfer" },
                        { label: "Online Payment", value: "Online Payment" }
                      ]}
                      value={paymentMethod ?? ""}
                      onChange={(v) => setPaymentMethod((v as PaymentMethod) || null)}
                      disabled={paymentStatus === "Pending"}
                    />
                  </div>
                </div>

                {(paymentStatus === "Paid" || paymentStatus === "Partially Paid") && (
                  <div className="space-y-1">
                    <Label>Payment Date *</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>
                )}

                {paymentStatus === "Partially Paid" && (
                  <div className="space-y-1">
                    <Label>Partially Paid Amount (LKR) *</Label>
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      max={snapshot.grandTotal}
                      value={partiallyPaidAmount}
                      onChange={(e) => setPartiallyPaidAmount(parseFloat(e.target.value) || "")}
                      placeholder="Amount paid so far"
                      required
                    />
                    {partiallyPaidAmount !== "" && snapshot.grandTotal > 0 && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Remaining: {fmt(snapshot.grandTotal - Number(partiallyPaidAmount))}
                      </p>
                    )}
                  </div>
                )}

                {!!paymentMethod && ["Bank Transfer", "Online Payment"].includes(paymentMethod) && (
                  <div className="space-y-1">
                    <Label>Reference / Invoice Number</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="INV-0001"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Notes / Reason</Label>
                  <Textarea
                    value={finalizeNotes}
                    onChange={(e) => setFinalizeNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional notes or details..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button type="button" variant="outline" onClick={() => setViewMode("details")} disabled={finalize.isPending}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={finalize.isPending}
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
                  >
                    {finalize.isPending ? "Finalising..." : "Finalise & Create"}
                  </Button>
                </div>
              </form>
            )}

            {/* ── Allocate Form View ───────────────────────────────────── */}
            {viewMode === "allocate" && linkedPayment && (() => {
              const totalAmount = linkedPayment.totalAmount;
              const alreadyPaid = linkedPayment.partiallyPaidAmount ?? 0;
              const outstanding = parseFloat((totalAmount - alreadyPaid).toFixed(2));
              const remainingAfter = parseFloat((outstanding - (allocateAmount || 0)).toFixed(2));
              const willFullyPay = allocateAmount > 0 && remainingAfter <= 0;
              const needsRef = !!allocateMethod && ["Bank Transfer", "Online Payment"].includes(allocateMethod);

              return (
                <form onSubmit={handleAllocateSubmit} className="space-y-4 max-w-md mx-auto py-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)] font-medium">Payment ID</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{linkedPayment.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)] font-medium">Total Amount</span>
                      <span className="font-semibold text-[var(--text-primary)]">{fmt(totalAmount)}</span>
                    </div>
                    {alreadyPaid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)] font-medium">Already Received</span>
                        <span className="font-semibold text-green-600">{fmt(alreadyPaid)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[var(--border)] pt-1.5 mt-1">
                      <span className="text-[var(--text-secondary)] font-medium">Outstanding Balance</span>
                      <span className="font-bold text-orange-500">{fmt(outstanding)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Allocation Amount (LKR) <span className="text-[var(--destructive)]">*</span></Label>
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      max={outstanding}
                      value={allocateAmount || ""}
                      onChange={(e) => handleAllocateAmountChange(e.target.value)}
                      placeholder={`Max ${fmt(outstanding)}`}
                      required
                    />
                    {allocateAmountError && (
                      <p className="flex items-center gap-1.5 text-xs text-[var(--destructive)] mt-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {allocateAmountError}
                      </p>
                    )}
                  </div>

                  {allocateAmount > 0 && !allocateAmountError && (
                    <div className={`rounded-lg px-4 py-2.5 flex items-center justify-between text-sm ${
                      willFullyPay
                        ? "bg-green-50 border border-green-200"
                        : "bg-[var(--primary-light)]"
                    }`}>
                      <span className={willFullyPay ? "text-green-700 font-medium" : "text-[var(--primary-text)]"}>
                        {willFullyPay ? "✓ Fully paid after allocation" : "Remaining after allocation"}
                      </span>
                      {!willFullyPay && (
                        <span className="font-bold text-[var(--primary-text)]">{fmt(remainingAfter)}</span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label>Payment Method</Label>
                    <Select
                      options={[
                        { label: "Select method", value: "" },
                        { label: "Cash", value: "Cash" },
                        { label: "Bank Transfer", value: "Bank Transfer" },
                        { label: "Online Payment", value: "Online Payment" }
                      ]}
                      value={allocateMethod ?? ""}
                      onChange={(v) => setAllocateMethod((v as PaymentMethod) || null)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={allocateDate}
                      onChange={(e) => setAllocateDate(e.target.value)}
                    />
                  </div>

                  {needsRef && (
                    <div className="space-y-1">
                      <Label>Reference / Invoice Number</Label>
                      <Input
                        value={allocateRef}
                        onChange={(e) => setAllocateRef(e.target.value)}
                        placeholder="INV-0001"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea
                      value={allocateNotes}
                      onChange={(e) => setAllocateNotes(e.target.value)}
                      rows={2}
                      placeholder="Optional notes..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <Button type="button" variant="outline" onClick={() => setViewMode("details")} disabled={allocateMutation.isPending}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
                      disabled={allocateMutation.isPending || !!allocateAmountError || !allocateAmount}
                    >
                      {allocateMutation.isPending ? "Allocating..." : "Allocate Payment"}
                    </Button>
                  </div>
                </form>
              );
            })()}

            {/* ── Payment History (Timeline) View ────────────────────── */}
            {viewMode === "history" && (
              <div className="space-y-5 max-w-lg mx-auto py-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] mb-0.5">Total</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{fmt(historyTotalAmount)}</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-green-600 mb-0.5">Received</p>
                    <p className="text-sm font-bold text-green-700">{fmt(historyTotalPaid)}</p>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-orange-500 mb-0.5">Outstanding</p>
                    <p className="text-sm font-bold text-orange-600">{fmt(historyOutstanding)}</p>
                  </div>
                </div>

                {historyTotalAmount > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span>Collection progress</span>
                      <span className="font-medium">
                        {Math.min(100, Math.round((historyTotalPaid / historyTotalAmount) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (historyTotalPaid / historyTotalAmount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {history && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">Current status:</span>
                    <PaymentStatusBadge status={history.paymentStatus} />
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
                    Transaction Timeline
                  </h3>

                  {historyLoading ? (
                    <div className="flex items-center justify-center py-10 text-[var(--text-secondary)]">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm">Loading transactions...</span>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-secondary)]">
                      <Clock className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No payment transactions recorded yet.</p>
                      <p className="text-xs opacity-70">Use &quot;Allocate Payment&quot; to record a payment.</p>
                    </div>
                  ) : (
                    <ol className="relative border-l-2 border-[var(--border)] space-y-0 ml-2">
                      {transactions.map((tx, idx) => {
                        const isLast = idx === transactions.length - 1;
                        return (
                          <li key={tx._id} className="ml-5 pb-6">
                            <span
                              className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                idx === 0
                                  ? "border-green-500 bg-green-500"
                                  : "border-[var(--border)] bg-[var(--surface)]"
                              }`}
                            >
                              <CheckCircle2
                                className={`h-2.5 w-2.5 ${idx === 0 ? "text-white" : "text-[var(--text-secondary)]"}`}
                              />
                            </span>

                            <div
                              className={`rounded-lg border px-4 py-3 space-y-2 ${
                                idx === 0
                                  ? "border-green-200 bg-green-50"
                                  : "border-[var(--border)] bg-[var(--surface-hover)]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span
                                    className={`text-base font-bold ${
                                      idx === 0 ? "text-green-700" : "text-[var(--text-primary)]"
                                    }`}
                                  >
                                    {fmt(tx.amount)}
                                  </span>
                                  {idx === 0 && (
                                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-green-600 bg-green-100 rounded px-1.5 py-0.5">
                                      Latest
                                    </span>
                                  )}
                                  {isLast && transactions.length > 1 && (
                                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5">
                                      First
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap mt-0.5">
                                  Recorded {fmtDateTime(tx.createdAt)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div>
                                  <span className="text-[var(--text-secondary)]">Payment Date</span>
                                  <p className="font-medium text-[var(--text-primary)]">
                                    {fmtDate(tx.paymentDate)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[var(--text-secondary)]">Method</span>
                                  <p className="font-medium text-[var(--text-primary)]">
                                    {tx.paymentMethod ?? "—"}
                                  </p>
                                </div>
                                {tx.referenceNumber && (
                                  <div className="col-span-2">
                                    <span className="text-[var(--text-secondary)]">Reference</span>
                                    <p className="font-mono font-medium text-[var(--text-primary)]">
                                      {tx.referenceNumber}
                                    </p>
                                  </div>
                                )}
                                {tx.notes && (
                                  <div className="col-span-2">
                                    <span className="text-[var(--text-secondary)]">Notes</span>
                                    <p className="text-[var(--text-primary)] italic">{tx.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                  <Button type="button" variant="outline" onClick={() => setViewMode("details")}>
                    Back to Snapshot Details
                  </Button>
                </div>
              </div>
            )}
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
