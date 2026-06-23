"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Textarea, Select,
} from "@/components";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAddSnapshotOverride } from "@/api/services/finance/uom-service";
import type { UomSnapshot } from "@/types/uom-types";

interface Props {
  projectId: string;
  snapshot: UomSnapshot | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  uomTypeId: "",
  newCount: 0,
  newPricePerUnit: 0,
  reason: "",
};

export function SnapshotOverrideModal({ projectId, snapshot, open, onClose }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const addOverride = useAddSnapshotOverride(
    projectId,
    snapshot?._id ?? ""
  );

  useEffect(() => {
    if (!open || !snapshot) return;
    const firstLine = snapshot.lines[0];
    setForm({
      uomTypeId: firstLine?.uomTypeId ?? "",
      newCount: firstLine?.count ?? 0,
      newPricePerUnit: firstLine?.pricePerUnit ?? 0,
      reason: "",
    });
    setError(null);
  }, [open, snapshot]);

  const selectedLine = snapshot?.lines.find((l) => l.uomTypeId === form.uomTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.reason.trim()) {
      setError("A reason is required for override entries.");
      return;
    }
    try {
      await addOverride.mutateAsync({
        uomTypeId: form.uomTypeId,
        newCount: form.newCount,
        newPricePerUnit: form.newPricePerUnit,
        reason: form.reason,
      });
      toast.success("Override recorded. Snapshot data is preserved for audit.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to record override.";
      setError(msg);
      toast.error(msg);
    }
  };

  if (!snapshot) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Add Override — {snapshot.billingMonth}
          </DialogTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            Overrides are appended as audit entries. The original snapshot data is never modified.
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UOM Type */}
          <div className="space-y-1.5">
            <Label>UOM Type *</Label>
            <Select
              options={snapshot.lines.map((l) => ({ label: l.name, value: l.uomTypeId }))}
              value={form.uomTypeId}
              onChange={(v) => {
                const line = snapshot.lines.find((l) => l.uomTypeId === v);
                setForm((prev) => ({
                  ...prev,
                  uomTypeId: v,
                  newCount: line?.count ?? 0,
                  newPricePerUnit: line?.pricePerUnit ?? 0,
                }));
              }}
            />
          </div>

          {/* Original values strip */}
          {selectedLine && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 space-y-1.5 text-sm">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Original Values (locked)</p>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Count</span>
                <span className="font-mono font-semibold">{selectedLine.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Price/Unit</span>
                <span className="font-mono font-semibold">LKR {selectedLine.pricePerUnit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Line Total</span>
                <span className="font-mono font-semibold">{selectedLine.lineTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Corrected values */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Corrected Count *</Label>
              <Input
                type="number"
                min={0}
                value={form.newCount}
                onChange={(e) => setForm((p) => ({ ...p, newCount: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Corrected Price/Unit</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.newPricePerUnit}
                onChange={(e) => setForm((p) => ({ ...p, newPricePerUnit: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Effective override total preview */}
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
            <span className="text-sm text-amber-700">Override Line Total</span>
            <span className="text-base font-bold text-amber-800">
              {(form.newCount * form.newPricePerUnit).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label>Reason *</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              rows={3}
              placeholder="Explain why this override is needed…"
              required
            />
          </div>

          <DialogFooter className="border-t border-[var(--border)] pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={addOverride.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addOverride.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {addOverride.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Recording…</>
              ) : "Record Override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
