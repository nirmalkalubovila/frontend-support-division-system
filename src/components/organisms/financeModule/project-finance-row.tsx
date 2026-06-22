"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PaymentStatusBadge } from "./payment-status-badge";
import type { ProjectWithFinance } from "@/types/finance-types";
import type { UserRole } from "@/types/global-types";

interface Props {
  project: ProjectWithFinance;
  userRole: UserRole;
}

function fmt(n: number) {
  return new Intl.NumberFormat("si-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
}

const CAN_VIEW_FULL: UserRole[] = ["super_admin", "manager", "senior_engineer"];

export function ProjectFinanceRow({ project, userRole }: Props) {
  const router = useRouter();
  const canViewFull = CAN_VIEW_FULL.includes(userRole);

  const mainContactName = (() => {
    if (Array.isArray(project.mainContacts) && project.mainContacts.length > 0) {
      return project.mainContacts[0].name ?? "—";
    }
    return project.mainContact?.name ?? "—";
  })();

  const overallStatus: "Paid" | "Pending" | "Overdue" =
    project.finance.count === 0
      ? "Pending"
      : project.finance.outstanding <= 0
      ? "Paid"
      : "Pending";

  return (
    <tr
      className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
      onClick={() => router.push(`/finance/${project._id}`)}
    >
      <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
        <span className="group-hover:text-[var(--primary)] transition-colors">{project.name}</span>
      </td>
      <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">{mainContactName}</td>
      <td className="px-4 py-3 text-sm text-right">{project.allocatedHours}h</td>
      <td className="px-4 py-3 text-sm text-right">{project.usedHours}h</td>
      {canViewFull && (
        <>
          <td className="px-4 py-3 text-sm text-right font-medium">{fmt(project.finance.totalBilled)}</td>
          <td className="px-4 py-3 text-sm text-right text-green-600">{fmt(project.finance.totalReceived)}</td>
          <td className="px-4 py-3 text-sm text-right text-orange-500">{fmt(project.finance.outstanding)}</td>
        </>
      )}
      <td className="px-4 py-3">
        <PaymentStatusBadge status={overallStatus} />
      </td>
      <td className="px-4 py-3 w-8">
        <ArrowRight className="h-4 w-4 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </td>
    </tr>
  );
}
