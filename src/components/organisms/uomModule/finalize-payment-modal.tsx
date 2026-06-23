"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, Textarea,
} from "@/components";
import { AlertCircle } from "lucide-react";
import type { PaymentStatus, PaymentMethod } from "@/types/finance-types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: FinalizePayload) => void;
  loading: boolean;
  grandTotal: number;
}

export interface FinalizePayload {
  dueDate: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentDate: string | null;
  referenceNumber: string | null;
  notes: string | null;
  partiallyPaidAmount?: number | null;
}

const STATUSES: PaymentStatus[] = ["Pending", "Paid", "Partially Paid", "Overdue", "Cancelled"];
const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Online Payment"];
const NEEDS_REF: PaymentMethod[] = ["Bank Transfer", "Online Payment"];

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function FinalizePaymentModal({ open, onClose, onConfirm, loading, grandTotal }: Props) {
  const [dueDate, setDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [partiallyPaidAmount, setPartiallyPaidAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDueDate("");
      setPaymentStatus("Pending");
      setPaymentMethod(null);
      setPaymentDate("");
      setReferenceNumber("");
      setPartiallyPaidAmount("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  const isPaid = paymentStatus === "Paid";
  const isPartiallyPaid = paymentStatus === "Partially Paid";
  const needsRef = !!paymentMethod && NEEDS_REF.includes(paymentMethod);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPartiallyPaid && (partiallyPaidAmount === "" || Number(partiallyPaidAmount) <= 0)) {
      setError("Partially paid amount must be greater than zero.");
      return;
    }
    if (isPartiallyPaid && Number(partiallyPaidAmount) > grandTotal) {
      setError("Partially paid amount cannot exceed the grand total.");
      return;
    }

    onConfirm({
      dueDate: dueDate || null,
      paymentStatus,
      paymentMethod: paymentStatus === "Pending" ? null : paymentMethod,
      paymentDate: (isPaid || isPartiallyPaid) ? paymentDate || null : null,
      referenceNumber: needsRef ? referenceNumber || null : null,
      notes: notes || null,
      partiallyPaidAmount: isPartiallyPaid ? Number(partiallyPaidAmount) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalise UOM Snapshot & Create Payment</DialogTitle>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Fill in the billing details. This snapshot will be locked, and a payment record will be created.
          </p>
        </DialogHeader>

        {/* Grand Total Strip */}
        <div className="rounded-lg bg-[var(--primary-light)] px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--primary-text)]">Total Billed Amount</span>
          <span className="text-base font-bold text-[var(--primary-text)]">{fmt(grandTotal)}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Due Date */}
          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Status + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Payment Status</Label>
              <Select
                options={STATUSES.map((s) => ({ label: s, value: s }))}
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
                  ...METHODS.map((m) => ({ label: m, value: m })),
                ]}
                value={paymentMethod ?? ""}
                onChange={(v) => setPaymentMethod((v as PaymentMethod) || null)}
                disabled={paymentStatus === "Pending"}
              />
            </div>
          </div>

          {/* Payment Date — only when Paid or Partially Paid */}
          {(isPaid || isPartiallyPaid) && (
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

          {/* Partially Paid Amount */}
          {isPartiallyPaid && (
            <div className="space-y-1">
              <Label>Partially Paid Amount (LKR) *</Label>
              <Input
                type="number"
                min={0.01}
                step="any"
                max={grandTotal}
                value={partiallyPaidAmount}
                onChange={(e) => setPartiallyPaidAmount(parseFloat(e.target.value) || "")}
                placeholder="Amount paid so far"
                required
              />
              {partiallyPaidAmount !== "" && grandTotal > 0 && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Remaining: {fmt(grandTotal - Number(partiallyPaidAmount))}
                </p>
              )}
            </div>
          )}

          {/* Reference — only for Bank Transfer / Online Payment */}
          {needsRef && (
            <div className="space-y-1">
              <Label>Reference / Invoice Number</Label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="INV-0001"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes / Reason</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes or details..."
            />
          </div>

          <DialogFooter className="border-t border-[var(--border)] pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
            >
              {loading ? "Finalising..." : "Finalise & Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
