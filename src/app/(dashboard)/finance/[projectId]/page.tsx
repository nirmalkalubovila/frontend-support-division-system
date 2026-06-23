"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Pencil, Trash2, Search, Paperclip,
  Wallet, CheckCircle2, AlertCircle, Clock, ReceiptText,
  CreditCard, History, RotateCcw, Layers, Zap, ExternalLink,
} from "lucide-react";
import { Button, Input, Badge, Select } from "@/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { ConfirmDialog } from "@/components/molecules/confirmDialog";
import { UomBillingTab } from "@/components/organisms/uomModule/uom-billing-tab";
import useSessionStore from "@/store/session-store";
import type { UserRole } from "@/types/global-types";
import type { Payment, PaymentStatus, PaymentType } from "@/types/finance-types";

const CAN_EDIT: UserRole[] = ["super_admin", "manager"];
const CAN_VIEW_FULL: UserRole[] = ["super_admin", "manager", "senior_engineer"];
const STATUSES: PaymentStatus[] = ["Pending", "Paid", "Partially Paid", "Overdue", "Cancelled"];
const PAYMENT_TYPES: PaymentType[] = ["Advance", "Project Fixed Price", "CR Based", "UOM Based", "Other"];

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────
// Payments Tab — extracted so the page stays clean
// ─────────────────────────────────────────────────────────────
function PaymentsTab({ projectId }: { projectId: string }) {
  const userInfo = useSessionStore((s) => s.userInfo);
  const userRole = (userInfo?.role ?? "intern") as UserRole;
  const canEdit = CAN_EDIT.includes(userRole);
  const canViewFull = CAN_VIEW_FULL.includes(userRole);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [allocating, setAllocating] = useState<Payment | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Payment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<"dueDate" | "totalAmount" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: summary, isLoading: summaryLoading } = useProjectFinanceSummary(projectId);
  const { data: paymentsData, isLoading: paymentsLoading } = useProjectPayments(projectId, { limit: 200 });
  const deletePayment = useDeletePayment(projectId);

  const allPayments = paymentsData?.data ?? [];

  const filtered = useMemo(() => {
    let list = allPayments;
    if (statusFilter !== "all") list = list.filter((p) => p.paymentStatus === statusFilter);
    if (typeFilter !== "all") list = list.filter((p) => p.paymentType === typeFilter);
    if (fromDate) list = list.filter((p) => p.dueDate && new Date(p.dueDate) >= new Date(fromDate));
    if (toDate) list = list.filter((p) => p.dueDate && new Date(p.dueDate) <= new Date(toDate + "T23:59:59"));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
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
  }, [allPayments, statusFilter, typeFilter, search, sortBy, sortOrder, fromDate, toDate]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    await deletePayment.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("desc"); }
  };
  const sortIcon = (col: typeof sortBy) =>
    sortBy === col ? (sortOrder === "asc" ? " ↑" : " ↓") : "";

  const statusCounts = useMemo(
    () =>
      STATUSES.reduce((acc, s) => {
        acc[s] = allPayments.filter((p) => p.paymentStatus === s).length;
        return acc;
      }, {} as Record<PaymentStatus, number>),
    [allPayments]
  );

  return (
    <div className="space-y-5">
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

      {/* Info strip + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm flex-1">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Total Entries: <strong className="text-[var(--text-primary)]">{allPayments.length}</strong></span>
          </div>
          {STATUSES.map(
            (s) =>
              statusCounts[s] > 0 && (
                <div key={s} className="flex items-center gap-1.5">
                  <PaymentStatusBadge status={s} />
                  <span className="text-[var(--text-secondary)]">×{statusCounts[s]}</span>
                </div>
              )
          )}
        </div>
        {canEdit && (
          <Button
            size="sm"
            className="gap-1.5 shrink-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Payment
          </Button>
        )}
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
        <Input type="date" className="h-9 text-sm w-36" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="Due date from" />
        <Input type="date" className="h-9 text-sm w-36" value={toDate} onChange={(e) => setToDate(e.target.value)} title="Due date to" />
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 transition-opacity ${search || statusFilter !== "all" || typeFilter !== "all" || fromDate || toDate ? "opacity-100" : "opacity-40"}`}
          title="Reset filters"
          onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setFromDate(""); setToDate(""); }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Reference</th>
                {canViewFull && (
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--primary)]"
                    onClick={() => toggleSort("totalAmount")}
                  >
                    Total{sortIcon("totalAmount")}
                  </th>
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
                    {Array.from({ length: canViewFull ? 9 : 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-[var(--surface-hover)] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canViewFull ? 9 : 8} className="px-4 py-16 text-center">
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
                  <tr key={p._id} className={`border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors ${p.isSystemGenerated ? "bg-[rgba(99,102,241,0.02)]" : ""}`}>
                    {/* Payment ID + Auto badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs text-[var(--text-secondary)]">{p.paymentId}</span>
                        {p.isSystemGenerated && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[var(--primary)] whitespace-nowrap">
                            <Zap className="h-2.5 w-2.5" /> Auto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{p.paymentType}</Badge>
                    </td>
                    {/* UOM / billing period */}
                    <td className="px-4 py-3 text-xs">
                      {p.isSystemGenerated && p.month
                        ? <span className="font-semibold text-[var(--primary)]">UOM · {p.month}</span>
                        : p.uom
                          ? <span className="text-[var(--text-secondary)]">{p.uom}</span>
                          : <span className="text-[var(--text-tertiary)]">—</span>
                      }
                    </td>
                    {canViewFull && (
                      <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                        {fmt(p.totalAmount)}
                      </td>
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
                        {/* Allocate — works for both system and manual payments */}
                        {canEdit && (p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid") && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Allocate payment" onClick={() => setAllocating(p)}>
                            <CreditCard className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {/* Transaction history — always available */}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--primary)]"
                          title="Payment history" onClick={() => setViewingHistory(p)}>
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        {/* Edit / Delete for all payments */}
                        {canEdit && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                              title="Edit payment"
                              onClick={() => { setEditing(p); setModalOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--destructive)]"
                              title="Delete payment"
                              onClick={() => setDeletingId(p._id)}>
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

      {/* Modals */}
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
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null); }}
        title="Delete Payment"
        description="Are you sure you want to delete this payment entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deletePayment.isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function ProjectFinanceDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const { data: project, isLoading: projectLoading } = useGetProjectById(projectId);

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

  const mainContactName =
    Array.isArray(project?.mainContacts) && project.mainContacts.length > 0
      ? project.mainContacts[0]?.name ?? "—"
      : project?.mainContact?.name ?? "—";

  return (
    <div className="space-y-5">
      {/* Header */}
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
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {project?.name ?? "Project Finance"}
            </h1>
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

      {/* Tabbed layout */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="bg-[var(--background)] border border-[var(--border)]">
          <TabsTrigger value="payments" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <Wallet className="h-4 w-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="uom" className="gap-2 text-sm data-[state=active]:text-[var(--primary)]">
            <Layers className="h-4 w-4" /> UOM Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <PaymentsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="uom">
          <UomBillingTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
