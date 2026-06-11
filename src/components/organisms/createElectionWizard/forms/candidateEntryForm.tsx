"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CandidateImageField } from "@/components/molecules/candidateImageField";
import { Trash2, GripVertical } from "lucide-react";
import type { CreateCandidateInput } from "@/types/election";

interface CandidateEntryFormProps {
  candidates: CreateCandidateInput[];
  onCandidatesChange: (candidates: CreateCandidateInput[]) => void;
  errors?: { candidates?: string };
}

export function CandidateEntryForm({
  candidates,
  onCandidatesChange,
  errors,
}: CandidateEntryFormProps) {
  const addCandidate = () => {
    onCandidatesChange([...candidates, { name: "", description: "", imageUrl: undefined }]);
  };

  const removeCandidate = (index: number) => {
    onCandidatesChange(candidates.filter((_, i) => i !== index));
  };

  const patchCandidate = (index: number, patch: Partial<CreateCandidateInput>) => {
    onCandidatesChange(
      candidates.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  return (
    <div className="space-y-4">
      {errors?.candidates && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.candidates}
        </p>
      )}

      {candidates.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-[var(--border)] rounded-xl">
          <p className="text-sm text-[var(--text-muted)]">
            No candidates added yet. Add at least 2 candidates.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((candidate, index) => (
          <div
            key={index}
            className="group flex gap-3 items-start rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--primary)]/20"
          >
            {/* Grip handle */}
            <div className="mt-2 text-[var(--text-muted)] cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              <GripVertical className="h-4 w-4" />
            </div>

            <CandidateImageField
              imageUrl={candidate.imageUrl}
              onImageUrlChange={(url) => patchCandidate(index, { imageUrl: url })}
            />

            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-medium text-[var(--primary)]">
                  {index + 1}
                </span>
                <Input
                  placeholder="Candidate name"
                  value={candidate.name}
                  onChange={(e) => patchCandidate(index, { name: e.target.value })}
                  className="flex-1 min-w-0"
                />
              </div>
              <Textarea
                placeholder="Brief description (optional)"
                value={candidate.description || ""}
                onChange={(e) => patchCandidate(index, { description: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeCandidate(index)}
              className="mt-2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-light)] transition-all duration-200"
              aria-label={`Remove candidate ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addCandidate} className="w-full">
        + Add Candidate
      </Button>
    </div>
  );
}
