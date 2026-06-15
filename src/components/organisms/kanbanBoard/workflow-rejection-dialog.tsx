"use client";

import React from "react";
import { AlertCircle, X, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKFLOW_TRANSITIONS } from "@/lib/task-workflow";
import type { TaskStatus } from "@/api/services/project-management/task-service";

interface Props {
  open: boolean;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  reason: string | null;
  onClose: () => void;
}

export function WorkflowRejectionDialog({ open, fromStatus, toStatus, reason, onClose }: Props) {
  if (!open || !fromStatus || !toStatus) return null;

  const allowed = WORKFLOW_TRANSITIONS[fromStatus] ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[var(--surface)] rounded-2xl border border-red-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 bg-red-50 border-b border-red-100">
          <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-red-700">Transition Not Allowed</h3>
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold px-1.5 py-0.5 bg-red-100 rounded">{fromStatus}</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span className="font-semibold px-1.5 py-0.5 bg-red-100 rounded">{toStatus}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-red-100 text-red-400 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{reason}</p>
          </div>

          {allowed.length > 0 && (
            <div className="bg-[var(--background)] rounded-xl p-3.5 border border-[var(--border)] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Allowed transitions from "{fromStatus}"
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {allowed.map((s) => (
                  <span key={s} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[rgba(99,102,241,0.08)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button onClick={onClose} size="sm" className="w-full h-9 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
