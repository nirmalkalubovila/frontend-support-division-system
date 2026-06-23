"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Input, Label, Select, Textarea,
} from "@/components";
import { Paperclip, X } from "lucide-react";
import { useCreatePayment, useUpdatePayment } from "@/api/services/finance/finance-service";
import { useGetProjectCRs } from "@/api/services/project-management/cr-service";
import type { Payment, CreatePaymentPayload, PaymentType, PaymentStatus, PaymentMethod } from "@/types/finance-types";

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
  editing?: Payment | null;
}

// Manual payment types only — UOM Based is system-generated (auto-created on snapshot finalisation)
const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: "Advance",            label: "Advance" },
  { value: "Project Fixed Price", label: "Project Fixed Price" },
  { value: "CR Based",           label: "CR Based" },
  { value: "Other",              label: "Other" },
];

const STATUSES: PaymentStatus[] = ["Pending", "Paid", "Partially Paid", "Overdue", "Cancelled"];
const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "Online Payment"];
const NEEDS_REF: PaymentMethod[] = ["Bank Transfer", "Online Payment"];

const EMPTY: CreatePaymentPayload = {
  paymentType: "Advance",
  uom: null,
  month: null,
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
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PaymentFormModal({ projectId, open, onClose, editing }: Props) {
  const [form, setForm] = useState<CreatePaymentPayload>(EMPTY);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const create = useCreatePayment(projectId);
  const update = useUpdatePayment(projectId);
  const { data: crsData } = useGetProjectCRs(projectId);

  useEffect(() => {
    if (editing) {
      setForm({
        paymentType: editing.paymentType,
        uom: editing.uom,
        month: editing.month,
        quantity: editing.quantity,
        pricePerUnit: editing.pricePerUnit,
        paymentDate: editing.paymentDate,
        dueDate: editing.dueDate,
        paymentStatus: editing.paymentStatus,
        paymentMethod: editing.paymentStatus === "Pending" ? null : editing.paymentMethod,
        referenceNumber: editing.paymentStatus === "Pending" ? null : editing.referenceNumber,
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

  const isPaid = form.paymentStatus === "Paid";
  const isPartiallyPaid = form.paymentStatus === "Partially Paid";
  const needsRef = !!form.paymentMethod && NEEDS_REF.includes(form.paymentMethod as PaymentMethod);
  const totalAmount = form.pricePerUnit || 0;
  const isCRBased = form.paymentType === "CR Based";
  const isOther = form.paymentType === "Other";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreatePaymentPayload = {
      ...form,
      uom: null,
      quantity: null,
      paymentDate: (isPaid || isPartiallyPaid) ? form.paymentDate : null,
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
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            UOM Based payments are auto-created when a monthly snapshot is finalised.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Payment Type — pill buttons */}
          <div className="space-y-1.5">
            <Label>Payment Type</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    // Clear uom when switching away from types that use it
                    const clearsUom = value !== "CR Based" && value !== "Other";
                    setForm((p) => ({
                      ...p,
                      paymentType: value,
                      uom: clearsUom ? null : p.uom,
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.paymentType === value
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* CR Based — CR reference input */}
          {isCRBased && (
            <div className="space-y-1">
              <Label>CR Reference *</Label>
              <Select
                options={[
                  { label: "Select CR...", value: "" },
                  ...(crsData?.data || []).map((cr) => ({
                    label: `${cr.crNumber} - ${cr.title}`,
                    value: cr.crNumber,
                  })),
                ]}
                value={form.uom ?? ""}
                onChange={(v) => set("uom", v || null)}
                placeholder="Select CR..."
                required
              />
              <p className="text-[10px] text-[var(--text-tertiary)]">Select the CR this payment relates to.</p>
            </div>
          )}

          {/* Other — description input */}
          {isOther && (
            <div className="space-y-1">
              <Label>Payment Description *</Label>
              <Input
                value={form.uom ?? ""}
                onChange={(e) => set("uom", e.target.value || null)}
                placeholder="e.g. Domain renewal, hosting fee…"
                required
              />
              <p className="text-[10px] text-[var(--text-tertiary)]">Briefly describe what this payment covers.</p>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <Label>Amount (LKR) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-tertiary)] pointer-events-none">
                LKR
              </span>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.pricePerUnit || ""}
                onChange={(e) => set("pricePerUnit", parseFloat(e.target.value) || 0)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Total preview */}
          <div className="rounded-lg bg-[var(--primary-light)] px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-[var(--primary-text)]">Total Amount</span>
            <span className="text-base font-bold text-[var(--primary-text)]">{fmt(totalAmount)}</span>
          </div>

          {/* Due Date */}
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
                onChange={(v) => {
                  if (v === "Pending") {
                    setForm((p) => ({
                      ...p,
                      paymentStatus: "Pending",
                      paymentMethod: null,
                    }));
                  } else {
                    set("paymentStatus", v as PaymentStatus);
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
                value={form.paymentMethod ?? ""}
                onChange={(v) => set("paymentMethod", (v as PaymentMethod) || null)}
                disabled={form.paymentStatus === "Pending"}
              />
            </div>
          </div>

          {/* Payment Date — only when Paid or Partially Paid */}
          {(isPaid || isPartiallyPaid) && (
            <div className="space-y-1">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={form.paymentDate?.slice(0, 10) ?? ""}
                onChange={(e) => set("paymentDate", e.target.value || null)}
                required
              />
            </div>
          )}

          {/* Partially Paid Amount */}
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
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                placeholder="Amount paid so far"
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
            <>
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
                  <div className="flex items-center gap-2 h-9 rounded-md border border-[var(--border)] bg-[var(--surface-hover)] px-3 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
                    <span className="flex-1 truncate text-xs text-[var(--text-primary)] min-w-0">{attachmentFile.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] shrink-0 whitespace-nowrap">
                      {(attachmentFile.size / 1024).toFixed(0)} KB
                    </span>
                    <button type="button" onClick={() => setAttachmentFile(null)}
                      className="ml-1 shrink-0 rounded p-0.5 hover:bg-[var(--destructive-light)]">
                      <X className="h-3.5 w-3.5 text-[var(--text-secondary)] hover:text-[var(--destructive)]" />
                    </button>
                  </div>
                ) : editing?.attachment ? (
                  <div className="flex items-center gap-2 h-9 rounded-md border border-[var(--border)] bg-[var(--surface-hover)] px-3 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                    <a href={editing.attachment} target="_blank" rel="noopener noreferrer"
                      className="flex-1 truncate text-xs text-[var(--primary)] underline underline-offset-2 min-w-0">
                      View existing attachment
                    </a>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 text-[10px] text-[var(--text-secondary)] hover:text-[var(--primary)] whitespace-nowrap">
                      Replace
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 w-full h-9 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">Attach file…</span>
                  </button>
                )}
              </div>
            </>
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
            <Button type="submit" disabled={isPending}
              className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
              {isPending ? "Saving..." : editing ? "Update" : "Add Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
