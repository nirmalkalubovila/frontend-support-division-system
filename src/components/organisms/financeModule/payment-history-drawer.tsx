"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePaymentTransactions } from "@/api/services/finance/finance-service";
import { PaymentStatusBadge } from "@/components/organisms/financeModule/payment-status-badge";
import { CheckCircle2, Clock, CreditCard, Loader2 } from "lucide-react";
import type { Payment } from "@/types/finance-types";

interface Props {
  projectId: string;
  payment: Payment | null;
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

export function PaymentHistoryDrawer({ projectId, payment, open, onClose }: Props) {
  const { data: history, isLoading } = usePaymentTransactions(
    projectId,
    open && payment ? payment._id : null
  );

  const transactions = history?.transactions ?? [];
  const totalAmount = history?.totalAmount ?? payment?.totalAmount ?? 0;
  const totalPaid = history?.partiallyPaidAmount ?? 0;
  const outstanding = history?.outstanding ?? totalAmount;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b border-[var(--border)] shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--primary)]" />
            Payment History
          </DialogTitle>
          {payment && (
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              {payment.paymentId}
            </p>
          )}
        </DialogHeader>

        <div className="overflow-y-auto py-4 space-y-5 pr-1">
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] mb-0.5">Total</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{fmt(totalAmount)}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-green-600 mb-0.5">Received</p>
              <p className="text-sm font-bold text-green-700">{fmt(totalPaid)}</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-orange-500 mb-0.5">Outstanding</p>
              <p className="text-sm font-bold text-orange-600">{fmt(outstanding)}</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalAmount > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Collection progress</span>
                <span className="font-medium">
                  {Math.min(100, Math.round((totalPaid / totalAmount) * 100))}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalPaid / totalAmount) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Status */}
          {history && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">Current status:</span>
              <PaymentStatusBadge status={history.paymentStatus} />
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
              Transaction Timeline
            </h3>

            {isLoading ? (
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
                      {/* Timeline dot */}
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

                      {/* Card */}
                      <div
                        className={`rounded-lg border px-4 py-3 space-y-2 ${
                          idx === 0
                            ? "border-green-200 bg-green-50"
                            : "border-[var(--border)] bg-[var(--surface-hover)]"
                        }`}
                      >
                        {/* Header row */}
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

                        {/* Details grid */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
