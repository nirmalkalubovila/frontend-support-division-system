"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BasicInfoFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  errors?: { title?: string; description?: string };
}

export function BasicInfoForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
}: BasicInfoFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="election-title">
          Election Title <span className="text-[var(--destructive)]">*</span>
        </Label>
        <Input
          id="election-title"
          placeholder="e.g. Student Council Election 2026"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={errors?.title ? "border-[var(--destructive)] focus:ring-[var(--destructive)]/20" : ""}
        />
        {errors?.title && (
          <p className="text-xs text-[var(--destructive)]">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="election-description">Description</Label>
        <Textarea
          id="election-description"
          placeholder="Describe what this election is about, any important information voters should know..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
        />
        {errors?.description && (
          <p className="text-xs text-[var(--destructive)]">{errors.description}</p>
        )}
      </div>
    </div>
  );
}
