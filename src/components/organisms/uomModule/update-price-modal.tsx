"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Textarea,
} from "@/components";
import { AlertCircle, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useUpdateUomPrice } from "@/api/services/finance/uom-service";
import type { UomType } from "@/types/uom-types";

interface Props {
  projectId: string;
  uomType: UomType | null;
  open: boolean;
  onClose: () => void;
}

export function UpdatePriceModal({ projectId, uomType, open, onClose }: Props) {
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateUomPrice(projectId, uomType?._id ?? "");

  useEffect(() => {
    if (!open || !uomType) return;
    setPricePerUnit(uomType.baselinePrice);
    // Default to current month
    const now = new Date();
    setEffectiveFrom(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    );
    setNotes("");
    setError(null);
  }, [open, uomType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pricePerUnit < 0) {
      setError("Price cannot be negative.");
      return;
    }
    try {
      await update.mutateAsync({ pricePerUnit, effectiveFrom: effectiveFrom || undefined, notes: notes || null });
      toast.success("Price updated. A new versioned record has been created.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update price.";
      setError(msg);
      toast.error(msg);
    }
  };

  if (!uomType) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
            Update Price — {uomType.name}
          </DialogTitle>
          <p className="text-xs text-[var(--text-secondary)]">
            A new versioned pricing record will be created. Historical billing data is preserved.
          </p>
        </DialogHeader>

        {/* Current price strip */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Current price</span>
          <span className="font-semibold text-[var(--text-primary)]">
            LKR {uomType.baselinePrice.toLocaleString()}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 text-xs text-[var(--destructive)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>New Price per Unit (LKR) *</Label>
            <Input
              type="number"
              min={0}
              step="any"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Effective From (YYYY-MM)</Label>
            <Input
              type="month"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Defaults to the current month if left blank.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Reason for price change…"
            />
          </div>

          <DialogFooter className="border-t border-[var(--border)] pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={update.isPending}
              className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
            >
              {update.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Updating…</>
              ) : "Update Price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
