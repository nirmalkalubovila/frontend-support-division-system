"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Label, Textarea,
} from "@/components";
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { useUpdateSnapshotCounts } from "@/api/services/finance/uom-service";
import type { UomSnapshot } from "@/types/uom-types";

interface Props {
  projectId: string;
  snapshot: UomSnapshot | null;
  open: boolean;
  onClose: () => void;
}

function DiffBadge({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return <span className="text-[10px] text-[var(--text-tertiary)]">—</span>;
  const delta = current - previous;
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
      <Minus className="h-2.5 w-2.5" /> same
    </span>
  );
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
      <TrendingUp className="h-2.5 w-2.5" /> +{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-500">
      <TrendingDown className="h-2.5 w-2.5" /> {delta}
    </span>
  );
}

export function SnapshotCountsEditor({ projectId, snapshot, open, onClose }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateSnapshotCounts(projectId, snapshot?._id ?? "");

  useEffect(() => {
    if (!open || !snapshot) return;
    const init: Record<string, number> = {};
    snapshot.lines.forEach((l) => { init[l.uomTypeId] = l.count; });
    setCounts(init);
    setNotes("");
    setError(null);
  }, [open, snapshot]);

  const previewTotal = snapshot
    ? snapshot.lines.reduce((sum, l) => {
        const c = counts[l.uomTypeId] ?? l.count;
        return sum + c * l.pricePerUnit;
      }, 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!snapshot) return;

    const lines = snapshot.lines.map((l) => ({
      uomTypeId: l.uomTypeId,
      count: counts[l.uomTypeId] ?? l.count,
    }));

    try {
      await update.mutateAsync({ lines, notes: notes || null });
      toast.success("Counts updated.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update counts.";
      setError(msg);
      toast.error(msg);
    }
  };

  if (!snapshot) return null;

  const isFinalized = snapshot.status === "finalized";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Counts — {snapshot.billingMonth}</DialogTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            Adjust UOM counts for this billing period. Differences from the previous month are highlighted.
          </p>
        </DialogHeader>

        {isFinalized && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            This snapshot is finalised. Unlock it first to edit counts.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Table — guaranteed header/cell alignment */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    UOM Type
                  </th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-20">
                    Prev
                  </th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-24">
                    Count
                  </th>
                  <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-20">
                    Diff
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] w-28">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {snapshot.lines.map((line) => {
                  const count = counts[line.uomTypeId] ?? line.count;
                  const lineTotal = count * line.pricePerUnit;
                  const hasChange = line.previousCount !== null && count !== line.previousCount;

                  return (
                    <tr
                      key={line.uomTypeId}
                      className={`transition-colors ${hasChange ? "bg-[rgba(99,102,241,0.03)]" : "bg-[var(--surface)]"}`}
                    >
                      {/* UOM Type */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{line.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          @ LKR {line.pricePerUnit.toLocaleString()}
                        </p>
                      </td>

                      {/* Prev */}
                      <td className="px-4 py-3 text-center font-mono text-[var(--text-secondary)]">
                        {line.previousCount ?? "—"}
                      </td>

                      {/* Editable count */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={count}
                          onChange={(e) =>
                            setCounts((prev) => ({
                              ...prev,
                              [line.uomTypeId]: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          disabled={isFinalized}
                          className="w-full h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-center text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Diff */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <DiffBadge current={count} previous={line.previousCount} />
                        </div>
                      </td>

                      {/* Line total */}
                      <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)] font-mono">
                        {lineTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand total footer row */}
              <tfoot>
                <tr className="border-t border-[var(--border)] bg-[var(--surface-hover)]">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-[var(--text-primary)]">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-[var(--primary)] font-mono">
                    {previewTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {!isFinalized && (
            <div className="space-y-1.5">
              <Label>Edit notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Reason for count adjustment…"
              />
            </div>
          )}

          <DialogFooter className="border-t border-[var(--border)] pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
              {isFinalized ? "Close" : "Cancel"}
            </Button>
            {!isFinalized && (
              <Button
                type="submit"
                disabled={update.isPending}
                className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
              >
                {update.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving…</>
                  : "Save Counts"
                }
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
