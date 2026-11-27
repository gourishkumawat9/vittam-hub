"use client";

import { uploadFile } from "@vittamhub/api-client";
import { Building2, Camera, Loader2, Trash2, User } from "@vittamhub/ui/icons";
import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ImageCropDialog } from "./ImageCropDialog";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  /** A round profile photo (the default) or a square logo. */
  kind?: "photo" | "logo";
}

/**
 * A profile photo or logo, LinkedIn-style: pick a picture, crop and zoom it in
 * a round (photo) or square (logo) frame, and only the cropped image is
 * uploaded, at 400×400 for a photo and 512×512 for a logo. JPG, PNG or WebP up
 * to 8 MB can be picked; what is uploaded is far smaller.
 */
export function AvatarUpload({ value, onChange, label, hint, kind = "photo" }: AvatarUploadProps) {
  const isLogo = kind === "logo";
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [picked, setPicked] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That image is over 8 MB. Pick a smaller one");
      return;
    }
    setPicked(file);
  };

  const upload = async (cropped: File) => {
    setPicked(null);
    setIsUploading(true);
    try {
      onChange(await uploadFile(cropped, isLogo ? "logos" : "avatars"));
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "Upload failed. Please try again");
    } finally {
      setIsUploading(false);
    }
  };

  const Placeholder = isLogo ? Building2 : User;
  const shapeClass = isLogo ? "rounded-card" : "rounded-full";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-primary">{label ?? (isLogo ? "Logo" : "Profile photo")}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label={value ? `Change ${isLogo ? "logo" : "photo"}` : `Add ${isLogo ? "a logo" : "a photo"}`}
          aria-describedby={hintId}
          className={cn(
            "group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-background-secondary transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
            shapeClass,
            !value && "border-dashed",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL, not a static asset next/image can optimize at build time
            <img src={value} alt="" className={cn("h-full w-full", isLogo ? "object-contain" : "object-cover")} />
          ) : (
            <Placeholder className="h-8 w-8 text-text-secondary" aria-hidden="true" />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-brand-900/45 text-white opacity-0 transition-opacity group-hover:opacity-100",
              isUploading && "opacity-100",
            )}
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </span>
        </button>

        <div className="flex flex-col items-start gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-button border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-secondary disabled:opacity-50"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {isUploading ? "Uploading…" : value ? "Change" : isLogo ? "Add logo" : "Add photo"}
            </button>
            {value && !isUploading && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1.5 rounded-button px-2.5 py-2 text-sm text-text-secondary transition-colors hover:bg-background-secondary hover:text-danger-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
          <p id={hintId} className="text-xs text-text-secondary">
            {hint ?? (isLogo ? "A square logo works best. JPG, PNG or WebP." : "A clear, front-facing photo builds trust. JPG, PNG or WebP.")}
          </p>
        </div>

        <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
      </div>
      {error && (
        <p className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      )}

      <ImageCropDialog
        file={picked}
        shape={isLogo ? "square" : "circle"}
        outputSize={isLogo ? 512 : 400}
        // A logo keeps its transparency; a photo is a smaller JPEG.
        outputType={isLogo ? "image/png" : "image/jpeg"}
        title={isLogo ? "Crop your logo" : "Crop your photo"}
        onCancel={() => setPicked(null)}
        onApply={upload}
      />
    </div>
  );
}
