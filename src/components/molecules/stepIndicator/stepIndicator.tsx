"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav className={cn("w-full", className)} aria-label="Progress">
      {/* Mobile: simple text indicator */}
      <div className="flex items-center justify-between sm:hidden mb-4">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          {steps[currentStep]?.label}
        </span>
      </div>

      {/* Desktop: full step indicator */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                    isCompleted && "bg-[var(--primary)] text-white",
                    isCurrent && "bg-[var(--primary)] text-white ring-4 ring-[var(--primary-light)]",
                    isUpcoming && "bg-[var(--background)] text-[var(--text-muted)] border-2 border-[var(--border)]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium text-center max-w-[80px] leading-tight",
                    (isCompleted || isCurrent) ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-20px] transition-colors duration-300",
                    isCompleted ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
