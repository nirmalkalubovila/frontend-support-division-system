"use client";

import { Badge } from "@/components";
import type { PaymentStatus } from "@/types/finance-types";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  Paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Partially Paid": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={`text-xs font-medium border-0 ${STATUS_STYLES[status]}`}>
      {status}
    </Badge>
  );
}
