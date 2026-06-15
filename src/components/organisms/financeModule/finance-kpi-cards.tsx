"use client";

import { DollarSign, FolderKanban, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/atoms/statCard/statCard";
import type { FinanceKPIs } from "@/types/finance-types";

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
}

export function FinanceKPICards({ kpis }: { kpis: FinanceKPIs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
      <StatCard icon={FolderKanban} label="Total Projects" value={kpis.totalProjects} />
      <StatCard icon={DollarSign} label="Total Revenue" value={fmt(kpis.totalRevenue)} />
      <StatCard icon={CheckCircle2} label="Paid Amount" value={fmt(kpis.paid)} />
      <StatCard icon={Clock} label="Pending" value={fmt(kpis.pending)} />
      <StatCard icon={AlertCircle} label="Overdue" value={fmt(kpis.overdue)} />
    </div>
  );
}
