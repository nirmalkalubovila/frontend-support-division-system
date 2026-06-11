"use client";

import { useCallback, useId, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImageAction, type UploadImageState } from "@/lib/api/server/cloudinary";
import { Button, Input } from "@/components";
import { cn } from "@/lib/utils";
import Image from "next/image";

const MAX_BYTES = 5 * 1024 * 1024;

const initialUploadState: UploadImageState = {
  success: false,
  url: null,
  error: null,
};

export interface CandidateImageFieldProps {
  imageUrl: string | undefined;
  onImageUrlChange: (url: string | undefined) => void;
  disabled?: boolean;
}

export function CandidateImageField({
  imageUrl,
  onImageUrlChange,
  disabled = false,
}: CandidateImageFieldProps) {
  const inputId = useId();
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      if (!file.type.startsWith("image/")) {
        setLocalError("Only image files are allowed.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setLocalError("Image must be 5MB or smaller.");
        return;
      }
      setPending(true);
      try {
        const fd = new FormData();
        fd.append("image", file);
        const result = await uploadImageAction(initialUploadState, fd);
        if (result.success && result.url) {
          onImageUrlChange(result.url);
        } else {
          setLocalError(result.error ?? "Upload failed.");
        }
      } catch {
        setLocalError("Upload failed. Please try again.");
      } finally {
        setPending(false);
      }
    },
    [onImageUrlChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || pending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const blocked = disabled || pending;

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <div className="relative h-20 w-20">
        <Input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={blocked}
          onChange={onInputChange}
          aria-label="Candidate photo"
        />

        <label
          htmlFor={inputId}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={cn(
            "relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-center transition-colors",
            "hover:border-[var(--primary)]/40 hover:bg-[var(--surface-hover)]",
            blocked && "pointer-events-none opacity-60",
            imageUrl && "border-solid border-[var(--border-strong)] p-0"
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              fill
            />
          ) : (
            <>
              <ImagePlus
                className="h-6 w-6 text-[var(--text-muted)]"
                aria-hidden
              />
              <span className="mt-0.5 px-1 text-[10px] font-medium leading-tight text-[var(--text-muted)]">
                Add photo
              </span>
            </>
          )}

          {pending ? (
            <span
              className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/80 backdrop-blur-[2px]"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
            </span>
          ) : null}
        </label>

        {imageUrl && !pending ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            disabled={disabled}
            className="absolute -right-1.5 -top-1.5 h-7 w-7 rounded-full border border-[var(--border)] shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onImageUrlChange(undefined);
            }}
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      {localError ? (
        <p className="max-w-[5.5rem] text-[10px] leading-tight text-[var(--destructive)]">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
