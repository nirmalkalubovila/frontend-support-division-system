"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/atoms/statusBadge";
import { SchedulingForm } from "@/components/organisms/createElectionWizard/forms/schedulingForm";
import { updateScheduling } from "@/lib/api/server/scheduling/update-scheduling";
import { manuallyOpenElection } from "@/lib/api/server/scheduling/manually-open-election";
import { manuallyCloseElection } from "@/lib/api/server/scheduling/manually-close-election";
import type { SchedulingInput, ElectionStatus, SchedulingMode } from "@/types/election";
import { Save, Play, Square } from "lucide-react";

interface ScheduleManagerProps {
  electionId: string;
  initialStatus: string;
  initialSchedulingMode: string;
  initialStartAt: string | null;
  initialEndAt: string | null;
}

export function ScheduleManager({
  electionId,
  initialStatus,
  initialSchedulingMode,
  initialStartAt,
  initialEndAt,
}: ScheduleManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const status = initialStatus as ElectionStatus;
  const [scheduling, setScheduling] = useState<SchedulingInput>({
    mode: initialSchedulingMode as SchedulingMode,
    scheduledStartAt: initialStartAt || undefined,
    scheduledEndAt: initialEndAt || undefined,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateScheduling(electionId, scheduling);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    });
  };

  const handleOpen = () => {
    startTransition(async () => {
      await manuallyOpenElection(electionId);
      router.refresh();
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      await manuallyCloseElection(electionId);
      router.refresh();
    });
  };

  const canEdit = ["draft", "scheduled"].includes(status);

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Current status</p>
          <StatusBadge status={status} />
        </div>

        {/* Manual controls */}
        {initialSchedulingMode === "manual" && (
          <div className="flex gap-2">
            {(status === "draft" || status === "scheduled") && (
              <Button onClick={handleOpen} disabled={isPending} variant="secondary" className="bg-[var(--secondary)] text-white hover:bg-[var(--secondary-hover)]">
                <Play className="h-4 w-4" /> Open Voting
              </Button>
            )}
            {status === "open" && (
              <Button onClick={handleClose} disabled={isPending} variant="destructive">
                <Square className="h-4 w-4" /> Close Voting
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scheduling config */}
      {canEdit ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scheduling Mode</h3>
          <SchedulingForm scheduling={scheduling} onSchedulingChange={setScheduling} />
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="h-4 w-4" /> {isPending ? "Saving..." : "Save Schedule"}
            </Button>
            {saved && <p className="text-sm text-[var(--secondary)]">Saved!</p>}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Scheduling cannot be modified once the election is {status}.
          </p>
        </div>
      )}
    </div>
  );
}
