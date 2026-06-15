"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Input, Label, Select, Textarea,
} from "@/components";
import { Paperclip, X } from "lucide-react";
import { useCreatePayment, useUpdatePayment } from "@/api/services/finance/finance-service";
import type { Payment, CreatePaymentPayload, PaymentType, PaymentStatus, PaymentMethod } from "@/types/finance-types";

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
  editing?: Payment | null;
}

const STATUSES: PaymentStatus[] = ["Pending", "Paid", "Partially Paid", "Overdue", "Cancelled"];
const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Online Payment"];
const NEEDS_REF: PaymentMethod[] = ["Bank Transfer", "Online Payment"];

const EMPTY: CreatePaymentPayload = {
  paymentType: "Advance",
  uom: null,
  quantity: null,
  pricePerUnit: 0,
  paymentDate: null,
  dueDate: null,
  paymentStatus: "Pending",
  paymentMethod: null,
  referenceNumber: null,
  notes: null,
  partiallyPaidAmount: null,
  attachment: null,
};

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
}

export function PaymentFormModal({ projectId, open, onClose, editing }: Props) {
  const [form, setForm] = useState<CreatePaymentPayload>(EMPTY);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const create = useCreatePayment(projectId);
  const update = useUpdatePayment(projectId);

  useEffect(() => {
    if (editing) {
      setForm({
        paymentType: editing.paymentType,
        uom: editing.uom,
        quantity: editing.quantity,
        pricePerUnit: editing.pricePerUnit,
        paymentDate: editing.paymentDate,
        dueDate: editing.dueDate,
        paymentStatus: editing.paymentStatus,
        paymentMethod: editing.paymentMethod,
        referenceNumber: editing.referenceNumber,
        notes: editing.notes,
        partiallyPaidAmount: editing.partiallyPaidAmount,
        attachment: null,
      });
    } else {
      setForm(EMPTY);
    }
    setAttachmentFile(null);
  }, [editing, open]);

  const set = <K extends keyof CreatePaymentPayload>(key: K, val: CreatePaymentPayload[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const isUOM = form.paymentType === "UOM Based";
  const isPaid = form.paymentStatus === "Paid";
  const isPartiallyPaid = form.paymentStatus === "Partially Paid";
  const needsRef = !!form.paymentMethod && NEEDS_REF.includes(form.paymentMethod as PaymentMethod);

  const totalAmount = isUOM
    ? (form.quantity || 0) * (form.pricePerUnit || 0)
    : form.pricePerUnit || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreatePaymentPayload = {
      ...form,
      // Clear fields that shouldn't be sent based on current state
      paymentDate: isPaid ? form.paymentDate : null,
      partiallyPaidAmount: isPartiallyPaid ? form.partiallyPaidAmount : null,
      referenceNumber: needsRef ? form.referenceNumber : null,
      attachment: attachmentFile ?? null,
    };
    if (editing) {
      await update.mutateAsync({ paymentId: editing._id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Payment" : "Add Payment"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Payment Type toggle */}
          <div className="space-y-1.5">
            <Label>Payment Type</Label>
            <div className="flex gap-2">
              {(["Advance", "UOM Based"] as PaymentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("paymentType", t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.paymentType === t
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* UOM Based: UOM (text) + Quantity */}
          {isUOM && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Unit of Measure</Label>
                <Input
                  value={form.uom ?? ""}
                  onChange={(e) => set("uom", e.target.value || null)}
                  placeholder="e.g. Hour, Task, Sprint..."
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={form.quantity ?? ""}
                  onChange={(e) => set("quantity", parseFloat(e.target.value) || null)}
                  required
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <Label>{isUOM ? "Price per Unit (LKR)" : "Amount (LKR)"}</Label>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.pricePerUnit || ""}
              onChange={(e) => set("pricePerUnit", parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          {/* Total preview */}
          <div className="rounded-lg bg-[var(--primary-light)] px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-[var(--primary-text)]">Total Amount</span>
            <span className="text-base font-bold text-[var(--primary-text)]">{fmt(totalAmount)}</span>
          </div>

          {/* Due Date — always shown */}
          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={form.dueDate?.slice(0, 10) ?? ""}
              onChange={(e) => set("dueDate", e.target.value || null)}
            />
          </div>

          {/* Status + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Payment Status</Label>
              <Select
                options={STATUSES.map((s) => ({ label: s, value: s }))}
                value={form.paymentStatus ?? "Pending"}
                onChange={(v) => set("paymentStatus", v as PaymentStatus)}
              />
            </div>
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
          </div>

          {/* Payment Date — only when Paid */}
          {isPaid && (
            <div className="space-y-1">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={form.paymentDate?.slice(0, 10) ?? ""}
                onChange={(e) => set("paymentDate", e.target.value || null)}
                required
              />
            </div>
          )}

          {/* Partially Paid Amount — only when Partially Paid */}
          {isPartiallyPaid && (
            <div className="space-y-1">
              <Label>Partially Paid Amount (LKR)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                max={totalAmount}
                value={form.partiallyPaidAmount ?? ""}
                onChange={(e) => set("partiallyPaidAmount", parseFloat(e.target.value) || null)}
                placeholder="Enter amount paid so far"
                required
              />
              {form.partiallyPaidAmount != null && totalAmount > 0 && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Remaining: {fmt(totalAmount - (form.partiallyPaidAmount || 0))}
                </p>
              )}
            </div>
          )}

          {/* Reference + Attachment — only for Bank Transfer / Online Payment */}
          {needsRef && (
            <div className="space-y-3 rounded-lg border border-[var(--border)] p-3">
              <div className="space-y-1">
                <Label>Reference / Invoice Number</Label>
                <Input
                  value={form.referenceNumber ?? ""}
                  onChange={(e) => set("referenceNumber", e.target.value || null)}
                  placeholder="INV-0001"
                />
              </div>

              <div className="space-y-1">
                <Label>Attachment</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                />
                {attachmentFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                    <span className="flex-1 truncate text-[var(--text-primary)]">{attachmentFile.name}</span>
                    <button type="button" onClick={() => setAttachmentFile(null)}>
                      <X className="h-4 w-4 text-[var(--text-secondary)] hover:text-[var(--destructive)]" />
                    </button>
                  </div>
                ) : editing?.attachment ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                    <a
                      href={editing.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-[var(--primary)] underline"
                    >
                      View existing attachment
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)]"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach File
                  </Button>
                )}
              </div>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update" : "Add Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
