"use client";

import React, { useRef, useState, useId } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
}

export function ImageUploader({
  value,
  onUpload,
  onRemove,
  isUploading = false,
}: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, or WEBP)");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB");
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Hidden input placed outside conditional blocks to keep it mounted in the DOM */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {value ? (
        // Preview State
        <div className="relative group rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 flex flex-col items-center justify-center min-h-[140px] transition-all hover:border-[var(--primary)] overflow-hidden">
          <div className="max-w-full flex items-center justify-center p-2">
            <img
              src={value}
              alt="Logo Preview"
              className="max-h-16 w-auto object-contain rounded-lg shadow-sm bg-[var(--surface)] p-1 border border-[var(--border)]"
            />
          </div>
          
          <span className="text-[10px] text-[var(--text-tertiary)] mt-1.5 break-all max-w-xs text-center px-4">
            {value.substring(value.lastIndexOf("/") + 1)}
          </span>

          {/* Action buttons: Replace and Remove */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerBrowse}
              className="h-8 text-xs px-3"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Replacing...
                </>
              ) : (
                "Replace Image"
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="h-8 text-xs px-3"
              disabled={isUploading}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        // Upload/Dropzone State - uses native label behavior for click handling
        <label
          htmlFor={inputId}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer p-4 transition-all duration-200 text-center select-none ${
            isDragActive
              ? "border-[var(--primary)] bg-[var(--primary-light)] scale-[0.99]"
              : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-[var(--primary-text)] animate-spin" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Uploading logo to database...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)]">
                <UploadCloud className="h-5 w-5 text-[var(--primary-text)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Click to upload or drag & drop
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  PNG, JPG, JPEG, or WEBP (Max 1MB)
                </p>
              </div>
            </div>
          )}
        </label>
      )}
    </div>
  );
}
