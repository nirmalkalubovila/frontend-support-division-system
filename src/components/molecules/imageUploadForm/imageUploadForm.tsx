"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";

import { uploadImageAction, type UploadImageState } from "@/lib/api/server/cloudinary";
import { Button } from "@/components/ui/button";

const initialState: UploadImageState = {
  success: false,
  url: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          Upload to Cloudinary
        </>
      )}
    </Button>
  );
}

export function ImageUploadForm() {
  const [state, formAction] = useActionState(uploadImageAction, initialState);

  const statusMessage = useMemo(() => {
    if (state.error) {
      return {
        tone: "error" as const,
        text: state.error,
      };
    }

    if (state.success && state.url) {
      return {
        tone: "success" as const,
        text: "Image uploaded successfully.",
      };
    }

    return null;
  }, [state.error, state.success, state.url]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-zinc-900 p-2 text-zinc-50">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Cloudinary Upload</h2>
          <p className="text-sm text-zinc-600">Pick an image and get back a secure URL from a server action.</p>
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium text-zinc-800">
            Image file
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            required
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200"
          />
          <p className="text-xs text-zinc-500">Max size: 5MB</p>
        </div>

        <SubmitButton />
      </form>

      {statusMessage ? (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
            statusMessage.tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {statusMessage.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      ) : null}

      {state.url ? (
        <div className="mt-4 space-y-3 rounded-md border border-zinc-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-800">Image URL</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(state.url || "")}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <p className="break-all text-sm text-zinc-600">{state.url}</p>
          <img
            src={state.url}
            alt="Uploaded preview"
            className="h-48 w-full rounded-md border border-zinc-200 object-cover sm:h-64"
          />
        </div>
      ) : null}
    </div>
  );
}
