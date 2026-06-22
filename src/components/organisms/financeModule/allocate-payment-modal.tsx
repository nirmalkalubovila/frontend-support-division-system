"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Input, Label, Select, Textarea,
} from "@/components";
import { AlertCircle } from "lucide-react";
import { useAllocatePayment } from "@/api/services/finance/finance-service";
import type { Payment, PaymentMethod, AllocatePaymentPayload } from "@/types/finance-types";

interface Props {
  projectId: string;
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}

const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Online Payment"];
const NEEDS_REF: PaymentMethod[] = ["Bank Transfer", "Online Payment"];

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

const EMPTY: AllocatePaymentPayload = {
  amount: 0,
  paymentMethod: null,
  paymentDate: null,
  referenceNumber: null,
  notes: null,
};

export function AllocatePaymentModal({ projectId, payment, open, onClose }: Props) {
  const [form, setForm] = useState<AllocatePaymentPayload>(EMPTY);
  const [amountError, setAmountError] = useState<string | null>(null);
  const allocate = useAllocatePayment(projectId);

  const totalAmount = payment?.totalAmount ?? 0;
  const alreadyPaid = payment?.partiallyPaidAmount ?? 0;
  const outstanding = parseFloat((totalAmount - alreadyPaid).toFixed(2));

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setAmountError(null);
    }
  }, [open, payment]);

  const set = <K extends keyof AllocatePaymentPayload>(key: K, val: AllocatePaymentPayload[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const needsRef = !!form.paymentMethod && NEEDS_REF.includes(form.paymentMethod as PaymentMethod);

  const handleAmountChange = (val: string) => {
    const num = parseFloat(val) || 0;
    set("amount", num);
    if (num <= 0) {
      setAmountError("Amount must be greater than zero");
    } else if (num > outstanding) {
      setAmountError(`Cannot exceed outstanding balance of ${fmt(outstanding)}`);
    } else {
      setAmountError(null);
    }
  };

  const remainingAfter = parseFloat((outstanding - (form.amount || 0)).toFixed(2));
  const willFullyPay = form.amount > 0 && remainingAfter <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountError || !payment) return;
    if (form.amount <= 0 || form.amount > outstanding) return;

    const payload: AllocatePaymentPayload = {
      amount: form.amount,
      paymentMethod: form.paymentMethod || null,
      paymentDate: form.paymentDate || null,
      referenceNumber: needsRef ? (form.referenceNumber || null) : null,
      notes: form.notes || null,
    };

    await allocate.mutateAsync({ paymentId: payment._id, data: payload });
    onClose();
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Allocate Payment</DialogTitle>
        </DialogHeader>

        {/* Payment summary strip */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Payment ID</span>
            <span className="font-mono font-medium text-[var(--text-primary)]">{payment.paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Total Amount</span>
            <span className="font-semibold text-[var(--text-primary)]">{fmt(totalAmount)}</span>
          </div>
          {alreadyPaid > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Already Received</span>
              <span className="font-semibold text-green-600">{fmt(alreadyPaid)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--border)] pt-1.5 mt-1">
            <span className="text-[var(--text-secondary)]">Outstanding Balance</span>
            <span className="font-bold text-orange-500">{fmt(outstanding)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Amount */}
          <div className="space-y-1">
            <Label>Allocation Amount (LKR) <span className="text-[var(--destructive)]">*</span></Label>
            <Input
              type="number"
              min={0.01}
              step="any"
              max={outstanding}
              value={form.amount || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={`Max ${fmt(outstanding)}`}
              required
            />
            {amountError && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--destructive)] mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {amountError}
              </p>
            )}
          </div>

          {/* Remaining after allocation preview */}
          {form.amount > 0 && !amountError && (
            <div className={`rounded-lg px-4 py-2.5 flex items-center justify-between text-sm ${
              willFullyPay
                ? "bg-green-50 border border-green-200"
                : "bg-[var(--primary-light)]"
            }`}>
              <span className={willFullyPay ? "text-green-700" : "text-[var(--primary-text)]"}>
                {willFullyPay ? "✓ Fully paid after allocation" : "Remaining after allocation"}
              </span>
              {!willFullyPay && (
                <span className="font-bold text-[var(--primary-text)]">{fmt(remainingAfter)}</span>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-1">
            <Label>Payment Method</Label>
            <Select
              options={[
                { label: "Select method", value: "" },
                ...METHODS.map((m) => ({ label: m, value: m })),
              ]}
              value={form.paymentMethod ?? ""}
              onChange={(v) => set("paymentMethod", (v as PaymentMethod) || null)}
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-1">
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={form.paymentDate?.slice(0, 10) ?? ""}
              onChange={(e) => set("paymentDate", e.target.value || null)}
            />
          </div>

          {/* Reference — only for Bank Transfer / Online Payment */}
          {needsRef && (
            <div className="space-y-1">
              <Label>Reference / Invoice Number</Label>
              <Input
                value={form.referenceNumber ?? ""}
                onChange={(e) => set("referenceNumber", e.target.value || null)}
                placeholder="INV-0001"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || null)}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={allocate.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={allocate.isPending || !!amountError || !form.amount}
            >
              {allocate.isPending ? "Allocating..." : "Allocate Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
