"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Zap } from "lucide-react";
import type { SchedulingInput, SchedulingMode } from "@/types/election";

interface SchedulingFormProps {
  scheduling: SchedulingInput;
  onSchedulingChange: (scheduling: SchedulingInput) => void;
  errors?: Record<string, string>;
}

const MODE_OPTIONS: { value: SchedulingMode; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Open and close the election manually whenever you want",
    icon: Zap,
  },
  {
    value: "automatic",
    label: "Automatic",
    description: "Set specific start and end dates; the election opens and closes automatically",
    icon: Clock,
  },
];

export function SchedulingForm({ scheduling, onSchedulingChange, errors }: SchedulingFormProps) {
  return (
    <div className="space-y-4">
      {errors?.scheduling && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.scheduling}
        </p>
      )}
      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = scheduling.mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onSchedulingChange({ ...scheduling, mode: option.value })
              }
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]/50 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg
                  ${isSelected ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Automatic mode: date/time pickers */}
      {scheduling.mode === "automatic" && (
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="start-datetime">Start Date & Time</Label>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={scheduling.scheduledStartAt || ""}
              onChange={(e) =>
                onSchedulingChange({
                  ...scheduling,
                  scheduledStartAt: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-datetime">End Date & Time</Label>
            <Input
              id="end-datetime"
              type="datetime-local"
              value={scheduling.scheduledEndAt || ""}
              onChange={(e) =>
                onSchedulingChange({
                  ...scheduling,
                  scheduledEndAt: e.target.value,
                })
              }
              min={scheduling.scheduledStartAt || ""}
            />
          </div>
          {scheduling.scheduledStartAt && scheduling.scheduledEndAt && (
            <p className="text-xs text-[var(--text-secondary)]">
              Duration:{" "}
              {(() => {
                const start = new Date(scheduling.scheduledStartAt);
                const end = new Date(scheduling.scheduledEndAt);
                const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
                const days = Math.round(hours / 24);
                return `${days} day${days !== 1 ? "s" : ""}`;
              })()}
            </p>
          )}
        </div>
      )}

      {/* Manual mode info */}
      {scheduling.mode === "manual" && (
        <div className="rounded-xl border border-[var(--info-light)] bg-[var(--info-light)] p-4">
          <p className="text-sm text-[var(--info)]">
            With manual scheduling, you&apos;ll control when voting opens and closes from the election dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
