"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Mail, AtSign } from "lucide-react";
import type { VoterBaseInput, VoterBaseMode } from "@/types/election";

interface VoterBaseFormProps {
  voterBase: VoterBaseInput;
  onVoterBaseChange: (voterBase: VoterBaseInput) => void;
  errors?: Record<string, string>;
}

const MODE_OPTIONS: { value: VoterBaseMode; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "anyone_with_link",
    label: "Anyone with link",
    description: "Anyone who has the election link can vote",
    icon: Globe,
  },
  {
    value: "restricted_emails",
    label: "Restricted to specific emails",
    description: "Only specified email addresses can vote",
    icon: Mail,
  },
  {
    value: "restricted_domain",
    label: "Restricted to email domain",
    description: "Only emails from a specific domain can vote",
    icon: AtSign,
  },
];

export function VoterBaseForm({ voterBase, onVoterBaseChange, errors }: VoterBaseFormProps) {
  return (
    <div className="space-y-4">
      {errors?.voterBase && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.voterBase}
        </p>
      )}
      {/* Mode selector */}
      <div className="space-y-3">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = voterBase.mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onVoterBaseChange({ ...voterBase, mode: option.value })
              }
              className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]/50 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                  ${isSelected ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Restricted emails input */}
      {voterBase.mode === "restricted_emails" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="voter-emails">Voter Email Addresses</Label>
          <Textarea
            id="voter-emails"
            placeholder="Enter email addresses, one per line or comma-separated&#10;john@example.com&#10;jane@example.com"
            value={(voterBase.emails || []).join("\n")}
            onChange={(e) =>
              onVoterBaseChange({
                ...voterBase,
                emails: e.target.value
                  .split(/[,\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={5}
          />
          <p className="text-xs text-[var(--text-muted)]">
            {(voterBase.emails || []).length} email(s) added
          </p>
        </div>
      )}

      {/* Restricted domain input */}
      {voterBase.mode === "restricted_domain" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="voter-domain">Allowed Email Domain</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">@</span>
            <Input
              id="voter-domain"
              placeholder="e.g. moratuwa.ac.lk"
              value={(voterBase.domains || [])[0] || ""}
              onChange={(e) =>
                onVoterBaseChange({
                  ...voterBase,
                  domains: [e.target.value.trim()].filter(Boolean),
                })
              }
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Only users with this email domain will be able to vote
          </p>
        </div>
      )}
    </div>
  );
}
