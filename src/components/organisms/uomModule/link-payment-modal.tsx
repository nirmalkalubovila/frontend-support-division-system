"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Select,
} from "@/components";
import { Link2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLinkPaymentToSnapshot } from "@/api/services/finance/uom-service";
import { useProjectPayments } from "@/api/services/finance/finance-service";
import type { UomSnapshot } from "@/types/uom-types";

interface Props {
  projectId: string;
  snapshot: UomSnapshot | null;
  open: boolean;
  onClose: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function LinkPaymentModal({ projectId, snapshot, open, onClose }: Props) {
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: paymentsData } = useProjectPayments(projectId, { limit: 200 });
  const linkPayment = useLinkPaymentToSnapshot(projectId, snapshot?._id ?? "");

  const eligiblePayments = (paymentsData?.data ?? []).filter(
    (p) => ["Pending", "Partially Paid", "Paid"].includes(p.paymentStatus)
  );

  useEffect(() => {
    if (!open) return;
    setSelectedPaymentId("");
    setError(null);
  }, [open, snapshot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPaymentId) {
      setError("Please select a payment.");
      return;
    }
    try {
      await linkPayment.mutateAsync({ paymentId: selectedPaymentId });
      toast.success("Payment linked. Snapshot has been finalised.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to link payment.";
      setError(msg);
      toast.error(msg);
    }
  };

  if (!snapshot) return null;

  const selectedPayment = eligiblePayments.find((p) => p._id === selectedPaymentId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[var(--primary)]" />
            Link Payment — {snapshot.billingMonth}
          </DialogTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            Allocate an existing payment entry against this snapshot. The snapshot will be auto-finalised on linking.
          </p>
        </DialogHeader>

        {/* Snapshot total */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Snapshot Total</span>
          <span className="font-bold text-[var(--text-primary)]">
            {snapshot.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {snapshot.currency}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Select Payment
            </label>
            {eligiblePayments.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4 border border-dashed border-[var(--border)] rounded-lg">
                No eligible payments found. Create a payment entry first.
              </p>
            ) : (
              <Select
                options={[
                  { label: "Select a payment…", value: "" },
                  ...eligiblePayments.map((p) => ({
                    label: `${p.paymentId} — ${fmt(p.totalAmount)} (${p.paymentStatus})`,
                    value: p._id,
                  })),
                ]}
                value={selectedPaymentId}
                onChange={setSelectedPaymentId}
              />
            )}
          </div>

          {/* Selected payment detail */}
          {selectedPayment && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Payment ID</span>
                <span className="font-mono font-semibold">{selectedPayment.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Total</span>
                <span className="font-semibold">{fmt(selectedPayment.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Status</span>
                <span className="font-semibold">{selectedPayment.paymentStatus}</span>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-[var(--border)] pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={linkPayment.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={linkPayment.isPending || !selectedPaymentId}
              className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
            >
              {linkPayment.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Linking…</>
              ) : "Link Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
