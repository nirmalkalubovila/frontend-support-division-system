"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components";
import { History, Loader2, ArrowRight } from "lucide-react";
import { useGetPricingHistory } from "@/api/services/finance/uom-service";
import type { UomType } from "@/types/uom-types";

interface Props {
  projectId: string;
  uomType: UomType | null;
  open: boolean;
  onClose: () => void;
}

export function PricingHistoryDrawer({ projectId, uomType, open, onClose }: Props) {
  const { data, isLoading } = useGetPricingHistory(
    projectId,
    open && uomType ? uomType._id : null
  );

  const versions = data?.pricingVersions ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b border-[var(--border)] shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--primary)]" />
            Pricing History — {uomType?.name ?? ""}
          </DialogTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            All versioned price records for this UOM type. Records are append-only.
          </p>
        </DialogHeader>

        <div className="overflow-y-auto py-4 space-y-3 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-secondary)]">
              <History className="h-8 w-8 opacity-30" />
              <p className="text-sm">No pricing history yet.</p>
            </div>
          ) : (
            <ol className="relative border-l-2 border-[var(--border)] space-y-0 ml-2">
              {versions.map((v, idx) => {
                const isActive = v.effectiveTo === null;
                return (
                  <li key={v._id} className="ml-5 pb-5">
                    {/* Timeline dot */}
                    <span
                      className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      }`}
                    />

                    <div
                      className={`rounded-lg border px-4 py-3 space-y-2 ${
                        isActive
                          ? "border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.04)]"
                          : "border-[var(--border)] bg-[var(--surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-lg font-bold ${isActive ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                          {v.pricePerUnit.toLocaleString()} {v.currency}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--primary)] bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] rounded px-2 py-0.5">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="font-medium">{v.effectiveFrom}</span>
                        <ArrowRight className="h-3 w-3 opacity-50" />
                        <span className="font-medium">{v.effectiveTo ?? "Present"}</span>
                      </div>

                      {v.notes && (
                        <p className="text-xs text-[var(--text-secondary)] italic">{v.notes}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
