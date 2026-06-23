"use client";

import { useState, useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button, Input, Select, Badge } from "@/components";
import { useFinanceKPIs, useAllProjectsFinance } from "@/api/services/finance/finance-service";
import { FinanceKPICards } from "@/components/organisms/financeModule/finance-kpi-cards";
import { ProjectFinanceRow } from "@/components/organisms/financeModule/project-finance-row";
import useSessionStore from "@/store/session-store";
import type { UserRole } from "@/types/global-types";

const PAYMENT_STATUSES = ["Paid", "Pending", "Overdue"];
const FINANCE_VISIBLE_ROLES: UserRole[] = ["super_admin", "manager", "senior_engineer"];

export default function FinancePage() {
  const userInfo = useSessionStore((s) => s.userInfo);
  const userRole = (userInfo?.role ?? "intern") as UserRole;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: kpis, isLoading: kpisLoading } = useFinanceKPIs();

  const apiParams = useMemo(() => ({
    search: search || undefined,
    paymentStatus: statusFilter !== "all" ? statusFilter : undefined,
    isActive: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
  }), [search, statusFilter, activeFilter]);

  const { data: allProjects = [], isLoading: projectsLoading } = useAllProjectsFinance(apiParams);

  // Client-side date range filter on project startDate
  const projects = useMemo(() => {
    let list = allProjects;
    if (fromDate) list = list.filter((p) => p.startDate && new Date(p.startDate) >= new Date(fromDate));
    if (toDate)   list = list.filter((p) => p.startDate && new Date(p.startDate) <= new Date(toDate + "T23:59:59"));
    return list;
  }, [allProjects, fromDate, toDate]);

  const hasFilters = search || statusFilter !== "all" || activeFilter !== "all" || fromDate || toDate;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setActiveFilter("all");
    setFromDate("");
    setToDate("");
  };

  const canViewFull = FINANCE_VISIBLE_ROLES.includes(userRole);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Finance</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Project billing, payments & revenue tracking</p>
      </div>

      {/* KPI Cards */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : kpis ? (
        <FinanceKPICards kpis={kpis} />
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          options={[
            { label: "All Statuses", value: "all" },
            ...PAYMENT_STATUSES.map((s) => ({ label: s, value: s })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <Select
          options={[
            { label: "All Projects", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          value={activeFilter}
          onChange={setActiveFilter}
        />

        <Input
          type="date"
          className="h-9 text-sm w-36"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          title="From date"
        />
        <Input
          type="date"
          className="h-9 text-sm w-36"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          title="To date"
        />

        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 transition-opacity ${hasFilters ? "opacity-100" : "opacity-40"}`}
          title="Reset filters"
          onClick={clearFilters}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <Badge variant="secondary" className="ml-auto text-xs">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Finance Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Main Contact</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Alloc Hrs</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Used Hrs</th>
                {canViewFull && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Total Billed</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Received</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Outstanding</th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Status</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projectsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({ length: canViewFull ? 9 : 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-[var(--surface-hover)] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={canViewFull ? 9 : 6} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <ProjectFinanceRow key={project._id} project={project} userRole={userRole} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
