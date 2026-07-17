"use client";

import { uploadFile } from "@vittamhub/api-client";
import { Button, Input } from "@vittamhub/ui";
import { FileText, Link2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_EVIDENCE_ITEMS = 6;

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(url);
}

interface EvidenceUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

/** Milestone "Evidence (optional)" — photos/documents uploaded via the existing presigned-upload flow, or external links pasted in directly. */
export function EvidenceUpload({ value, onChange }: EvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = value.length >= MAX_EVIDENCE_ITEMS;

  const addUrl = (url: string) => {
    if (!url || value.includes(url)) return;
    onChange([...value, url]);
  };

  const removeUrl = (url: string) => onChange(value.filter((u) => u !== url));

  const handleFile = async (file: File | undefined) => {
    if (!file || atLimit) return;
    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadFile(file, "documents");
      addUrl(url);
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addLink = () => {
    const trimmed = linkDraft.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setError("Enter a valid link (https://…)");
      return;
    }
    addUrl(trimmed);
    setLinkDraft("");
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-primary">Evidence (optional)</span>
      <p className="text-xs text-text-secondary">Photos, documents, or links that back up this milestone.</p>

      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((url) => (
            <li key={url} className="flex items-center gap-2 rounded-button border border-border px-3 py-1.5 text-xs">
              {isImageUrl(url) ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL, thumbnail only
                <img src={url} alt="" className="h-6 w-6 rounded object-cover" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
              )}
              <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate text-brand-primary hover:underline">
                {url}
              </a>
              <button type="button" onClick={() => removeUrl(url)} aria-label="Remove evidence">
                <X className="h-3.5 w-3.5 text-text-secondary hover:text-danger-600" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!atLimit && (
        <div className="flex gap-2">
          <Input
            placeholder="Paste a link…"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
          />
          <Button type="button" size="sm" variant="secondary" onClick={addLink}>
            <Link2 className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="secondary" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
            {!isUploading && <Upload className="h-3.5 w-3.5" />}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
