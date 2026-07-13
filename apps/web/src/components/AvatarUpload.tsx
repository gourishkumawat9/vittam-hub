"use client";

import { uploadFile } from "@vittamhub/api-client";
import { Loader2, Upload, User } from "lucide-react";
import { useRef, useState } from "react";

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function AvatarUpload({ value, onChange, label = "Profile picture" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadFile(file, "avatars");
      onChange(url);
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background-secondary">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL, not a static asset next/image can optimize at build time
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-7 w-7 text-text-secondary" aria-hidden="true" />
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-button border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-secondary disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? "Uploading…" : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
