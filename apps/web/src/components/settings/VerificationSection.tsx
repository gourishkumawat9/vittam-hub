"use client";

import { uploadFile, useMyVerification, useUploadDocument } from "@vittamhub/api-client";
import type { DocumentType, User, VerificationRequirement } from "@vittamhub/types";
import { Badge, Card, Skeleton } from "@vittamhub/ui";
import { CheckCircle2, Circle, Loader2, Upload } from "@vittamhub/ui/icons";
import Link from "next/link";
import { useState } from "react";

import { editProfileLink } from "@/lib/role-home";

const STATUS: Record<string, { label: string; variant: "success" | "brand" | "neutral" }> = {
  VERIFIED: { label: "Verified", variant: "success" },
  PENDING: { label: "In progress", variant: "brand" },
  UNVERIFIED: { label: "Not started", variant: "neutral" },
  REJECTED: { label: "Not verified", variant: "neutral" },
};

// What the storage accepts for documents (MediaService's list).
const ACCEPTED_FILES = "application/pdf,image/png,image/jpeg,image/webp";

/**
 * The Verified badge, and what this account's profile still needs for it.
 * The list comes from the same rules the API awards the badge by, so the two
 * can't disagree. Investors, mentors, incubators and universities had no
 * screen at all for the document their badge asks for, which is why none of
 * them could ever be verified.
 */
export function VerificationSection({ user }: { user: User }) {
  const { data: progress, isLoading } = useMyVerification();
  const uploadDocument = useUploadDocument();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editProfile = editProfileLink(user.role);

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }
  // No profile yet (the wizard isn't finished), or an account type with no badge.
  if (!progress) return null;

  const status = STATUS[progress.status] ?? STATUS.UNVERIFIED!;

  const handleFile = async (requirement: VerificationRequirement, type: DocumentType, file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploadingKey(requirement.key);
    try {
      let fileUrl: string;
      try {
        fileUrl = await uploadFile(file, "documents");
      } catch (cause) {
        setError(cause instanceof Error && cause.message ? cause.message : "That file couldn't be uploaded. Please try again.");
        return;
      }
      // A failure here is announced by the app's own error message.
      await uploadDocument.mutateAsync({ type, fileUrl, fileName: file.name }).catch(() => undefined);
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <Card id="verification" className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-text-primary">Verified badge</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="text-sm text-text-secondary">
        {progress.status === "VERIFIED"
          ? "Your profile shows the Verified badge and is listed ahead of profiles without one."
          : "Your profile is already listed. The badge is added on its own once everything below is in place, and verified profiles are shown first."}
      </p>

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {progress.requirements.map((requirement) => (
          <li key={requirement.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 text-sm">
            <span className="flex min-w-0 items-start gap-2">
              {requirement.met ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
              )}
              <span className={requirement.met ? "text-text-secondary" : "text-text-primary"}>
                {requirement.label}
                <span className="sr-only">{requirement.met ? " (done)" : " (still needed)"}</span>
              </span>
            </span>

            {!requirement.met && requirement.documentType && !user.isDemo && (
              <label className="flex cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-background-secondary focus-within:ring-2 focus-within:ring-brand-primary">
                {uploadingKey === requirement.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden />
                )}
                {uploadingKey === requirement.key ? "Uploading…" : "Upload file"}
                <input
                  type="file"
                  accept={ACCEPTED_FILES}
                  className="sr-only"
                  disabled={uploadingKey !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void handleFile(requirement, requirement.documentType!, file);
                  }}
                />
              </label>
            )}
            {!requirement.met && !requirement.documentType && editProfile && (
              <Link href={editProfile.href} className="font-medium text-brand-700 underline-offset-2 hover:underline">
                {editProfile.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p className="text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-text-secondary">
        {user.isDemo
          ? "Documents can't be uploaded to a shared demo account."
          : "PDF or image. Files you upload here stay private: nobody else can open them unless you choose to share one."}
      </p>
    </Card>
  );
}
