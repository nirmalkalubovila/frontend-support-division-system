"use client";

import React, { useRef, useState } from "react";
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

  const triggerBrowse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {value ? (
        // Preview State
        <div className="relative group rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 flex flex-col items-center justify-center min-h-[120px] transition-all hover:border-[var(--primary)] overflow-hidden">
          <div className="max-w-full flex items-center justify-center p-2">
            <img
              src={value}
              alt="Logo Preview"
              className="max-h-16 w-auto object-contain rounded-lg shadow-sm bg-[var(--surface)] p-1 border border-[var(--border)]"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="text-[10px] text-[var(--text-tertiary)] mt-2 break-all max-w-xs text-center px-4">
            {value.substring(value.lastIndexOf("/") + 1)}
          </span>
        </div>
      ) : (
        // Upload/Dropzone State
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer p-4 transition-all duration-200 text-center select-none ${
            isDragActive
              ? "border-[var(--primary)] bg-[var(--primary-light)] scale-[0.99]"
              : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
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
        </div>
      )}
    </div>
  );
}
