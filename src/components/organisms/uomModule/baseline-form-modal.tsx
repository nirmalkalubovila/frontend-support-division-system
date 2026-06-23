"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input,
} from "@/components";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfigureBaseline } from "@/api/services/finance/uom-service";
import type { UomBaseline, UomTypePayload } from "@/types/uom-types";

interface Props {
  projectId: string;
  baseline: UomBaseline | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_ROW = (): UomTypePayload => ({
  name: "",
  defaultCount: 0,
  baselinePrice: 0,
  currency: "LKR",
  isActive: true,
});

export function BaselineFormModal({ projectId, baseline, open, onClose }: Props) {
  const [rows, setRows] = useState<UomTypePayload[]>([EMPTY_ROW()]);
  const [error, setError] = useState<string | null>(null);
  const configure = useConfigureBaseline(projectId);

  // Seed from existing baseline when opening
  useEffect(() => {
    if (!open) return;
    if (baseline && baseline.uomTypes.length > 0) {
      setRows(
        baseline.uomTypes.map((t) => ({
          _id: t._id,
          name: t.name,
          defaultCount: t.defaultCount,
          baselinePrice: t.baselinePrice,
          currency: "LKR",
          isActive: t.isActive,
          order: t.order,
        }))
      );
    } else {
      setRows([EMPTY_ROW()]);
    }
    setError(null);
  }, [open, baseline]);

  const set = <K extends keyof UomTypePayload>(idx: number, key: K, val: UomTypePayload[K]) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));

  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);

  const removeRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    for (const [i, r] of rows.entries()) {
      if (!r.name.trim()) { setError(`Row ${i + 1}: Name is required.`); return; }
      if ((r.defaultCount ?? 0) < 0) { setError(`Row ${i + 1}: Quantity cannot be negative.`); return; }
      if ((r.baselinePrice ?? 0) < 0) { setError(`Row ${i + 1}: Price cannot be negative.`); return; }
    }
    try {
      await configure.mutateAsync({
        uomTypes: rows.map((r, i) => ({ ...r, currency: "LKR", order: i })),
      });
      toast.success("UOM baseline saved.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to save baseline.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Configure UOM Baseline</DialogTitle>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Define the billable units for this project. This becomes the master template for monthly snapshots.
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_110px_130px_72px_36px] gap-3 px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">UOM Name</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Default Qty</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Price / Unit (LKR)</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center">Active</span>
            <span />
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_110px_130px_72px_36px] gap-3 items-center px-3 py-3 rounded-xl border transition-colors ${
                  r.isActive
                    ? "border-[var(--border)] bg-[var(--surface)]"
                    : "border-dashed border-[var(--border)] bg-[var(--surface-hover)] opacity-60"
                }`}
              >
                {/* Name */}
                <Input
                  placeholder="e.g. Users, Warehouses…"
                  value={r.name}
                  onChange={(e) => set(idx, "name", e.target.value)}
                  className="h-9 text-sm font-medium"
                  required
                />

                {/* Default count */}
                <Input
                  type="number"
                  min={0}
                  value={r.defaultCount ?? ""}
                  onChange={(e) => set(idx, "defaultCount", Number(e.target.value))}
                  className="h-9 text-sm text-center"
                  placeholder="0"
                />

                {/* Price per unit */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-tertiary)] pointer-events-none">
                    LKR
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={r.baselinePrice ?? ""}
                    onChange={(e) => set(idx, "baselinePrice", Number(e.target.value))}
                    className="h-9 text-sm pl-10"
                    placeholder="0.00"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => set(idx, "isActive", !r.isActive)}
                    title={r.isActive ? "Click to deactivate" : "Click to activate"}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${
                      r.isActive ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        r.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  disabled={rows.length === 1}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--destructive)] hover:bg-[rgba(239,68,68,0.08)] disabled:opacity-20 transition-colors"
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add row */}
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[rgba(99,102,241,0.04)] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add UOM Type
          </button>

          <DialogFooter className="border-t border-[var(--border)] pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={configure.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={configure.isPending}
              className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
            >
              {configure.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving…</>
                : "Save Baseline"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
