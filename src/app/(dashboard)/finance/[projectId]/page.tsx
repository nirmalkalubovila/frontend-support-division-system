"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Pencil, Trash2,
  Search, Paperclip, Wallet, CheckCircle2, AlertCircle, Clock, ReceiptText, CreditCard, History,
} from "lucide-react";
import { Button, Input, Badge, Select } from "@/components";
import { StatCard } from "@/components/atoms/statCard/statCard";
import {
  useProjectPayments,
  useProjectFinanceSummary,
  useDeletePayment,
} from "@/api/services/finance/finance-service";
import { useGetProjectById } from "@/api/services/project-management/project-service";
import { PaymentFormModal } from "@/components/organisms/financeModule/payment-form-modal";
import { AllocatePaymentModal } from "@/components/organisms/financeModule/allocate-payment-modal";
import { PaymentHistoryDrawer } from "@/components/organisms/financeModule/payment-history-drawer";
import { PaymentStatusBadge } from "@/components/organisms/financeModule/payment-status-badge";
import useSessionStore from "@/store/session-store";
import type { UserRole } from "@/types/global-types";
import type { Payment, PaymentStatus, PaymentType } from "@/types/finance-types";

const CAN_EDIT: UserRole[] = ["super_admin", "manager"];
const CAN_VIEW_FULL: UserRole[] = ["super_admin", "manager", "senior_engineer"];
const STATUSES: PaymentStatus[] = ["Pending", "Paid", "Partially Paid", "Overdue", "Cancelled"];
const PAYMENT_TYPES: PaymentType[] = ["Advance", "UOM Based"];

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
}

export default function ProjectFinanceDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const userInfo = useSessionStore((s) => s.userInfo);
  const userRole = (userInfo?.role ?? "intern") as UserRole;
  const canEdit = CAN_EDIT.includes(userRole);
  const canViewFull = CAN_VIEW_FULL.includes(userRole);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [allocating, setAllocating] = useState<Payment | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "totalAmount" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: project, isLoading: projectLoading } = useGetProjectById(projectId);
  const { data: summary, isLoading: summaryLoading } = useProjectFinanceSummary(projectId);
  const { data: paymentsData, isLoading: paymentsLoading } = useProjectPayments(projectId, { limit: 200 });
  const deletePayment = useDeletePayment(projectId);

  const allPayments = paymentsData?.data ?? [];

  const filtered = useMemo(() => {
    let list = allPayments;
    if (statusFilter !== "all") list = list.filter((p) => p.paymentStatus === statusFilter);
    if (typeFilter !== "all") list = list.filter((p) => p.paymentType === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.paymentId.toLowerCase().includes(q) ||
        (p.referenceNumber ?? "").toLowerCase().includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === "totalAmount") { av = a.totalAmount; bv = b.totalAmount; }
      else if (sortBy === "dueDate") {
        av = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bv = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      } else {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? av - bv : bv - av;
    });
  }, [allPayments, statusFilter, typeFilter, search, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this payment entry?")) await deletePayment.mutateAsync(id);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("desc"); }
  };

  const sortIcon = (col: typeof sortBy) =>
    sortBy === col ? (sortOrder === "asc" ? " ↑" : " ↓") : "";

  const mainContactName = project?.mainContact?.name ?? "—";

  const statusCounts = useMemo(() =>
    STATUSES.reduce((acc, s) => {
      acc[s] = allPayments.filter((p) => p.paymentStatus === s).length;
      return acc;
    }, {} as Record<PaymentStatus, number>),
    [allPayments]
  );

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-[var(--surface)] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push("/finance")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{project?.name ?? "Project Finance"}</h1>
              <Badge variant="secondary" className="text-xs">
                {project?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {mainContactName}
              {project?.startDate && ` · Started ${new Date(project.startDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {canEdit && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
            Add Payment
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      {canViewFull && (
        summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard icon={Wallet} label="Total Billed" value={fmt(summary.totalBilled)} />
            <StatCard icon={CheckCircle2} label="Total Received" value={fmt(summary.totalReceived)} />
            <StatCard icon={AlertCircle} label="Outstanding" value={fmt(summary.outstanding)} />
          </div>
        ) : null
      )}

      {/* Project info strip */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Clock className="h-3.5 w-3.5" />
          <span>Allocated: <strong className="text-[var(--text-primary)]">{project?.allocatedHours ?? 0}h</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Clock className="h-3.5 w-3.5" />
          <span>Used: <strong className="text-[var(--text-primary)]">{project?.usedHours ?? 0}h</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <ReceiptText className="h-3.5 w-3.5" />
          <span>Total Entries: <strong className="text-[var(--text-primary)]">{allPayments.length}</strong></span>
        </div>
        {STATUSES.map((s) => statusCounts[s] > 0 && (
          <div key={s} className="flex items-center gap-1.5">
            <PaymentStatusBadge status={s} />
            <span className="text-[var(--text-secondary)]">×{statusCounts[s]}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search by ID, reference, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={[
            { label: "All Statuses", value: "all" },
            ...STATUSES.map((s) => ({ label: s, value: s })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <Select
          options={[
            { label: "All Types", value: "all" },
            ...PAYMENT_TYPES.map((t) => ({ label: t, value: t })),
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        {(search || statusFilter !== "all" || typeFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs"
            onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}>
            Clear
          </Button>
        )}
        <Badge variant="secondary" className="ml-auto text-xs">
          {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Payment ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">UOM / Qty</th>
                {canViewFull && (
                  <>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--primary)]"
                      onClick={() => toggleSort("totalAmount")}
                    >
                      Total{sortIcon("totalAmount")}
                    </th>
                  </>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--primary)]"
                  onClick={() => toggleSort("dueDate")}
                >
                  Due Date{sortIcon("dueDate")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Ref #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 w-32" />
              </tr>
            </thead>
            <tbody>
              {paymentsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({ length: canViewFull ? 9 : 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-[var(--surface-hover)] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canViewFull ? 9 : 7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                      <Wallet className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No payment entries found.</p>
                      {canEdit && (
                        <Button size="sm" variant="outline" className="mt-2 gap-1.5"
                          onClick={() => { setEditing(null); setModalOpen(true); }}>
                          <Plus className="h-3.5 w-3.5" /> Add First Payment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{p.paymentId}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{p.paymentType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                      {p.uom ? `${p.uom}${p.quantity != null ? ` × ${p.quantity}` : ""}` : "—"}
                    </td>
                    {canViewFull && (
                      <>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">{fmt(p.totalAmount)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">{p.paymentMethod ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[var(--text-secondary)]">{p.referenceNumber ?? "—"}</span>
                        {p.attachment && (
                          <a href={p.attachment} target="_blank" rel="noopener noreferrer" title="View attachment">
                            <Paperclip className="h-3.5 w-3.5 text-[var(--primary)] hover:opacity-70" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.paymentStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canEdit && (p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid") && (
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Allocate payment"
                            onClick={() => setAllocating(p)}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--primary)]"
                          title="Payment history"
                          onClick={() => setViewingHistory(p)}
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => { setEditing(p); setModalOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7 text-[var(--destructive)]"
                              onClick={() => handleDelete(p._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentFormModal
        projectId={projectId}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />

      <AllocatePaymentModal
        projectId={projectId}
        payment={allocating}
        open={!!allocating}
        onClose={() => setAllocating(null)}
      />

      <PaymentHistoryDrawer
        projectId={projectId}
        payment={viewingHistory}
        open={!!viewingHistory}
        onClose={() => setViewingHistory(null)}
      />
    </div>
  );
}
