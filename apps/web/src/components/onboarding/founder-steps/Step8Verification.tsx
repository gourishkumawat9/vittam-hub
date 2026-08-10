"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@vittamhub/api-client";
import { DocumentType, verificationStepSchema, type VerificationStepInput } from "@vittamhub/types";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const DOCUMENT_LABELS: Record<string, string> = {
  [DocumentType.INCORPORATION_CERTIFICATE]: "Certificate of Incorporation",
  [DocumentType.PAN]: "PAN",
  [DocumentType.GST]: "GST",
  [DocumentType.DPIIT_RECOGNITION]: "DPIIT Recognition",
  [DocumentType.TRADEMARK]: "Trademark",
  [DocumentType.PATENT]: "Patent",
  [DocumentType.PITCH_DECK]: "Pitch Deck",
  [DocumentType.FINANCIAL_STATEMENT]: "Financial Statements",
  [DocumentType.GOVERNMENT_ID]: "Founder Identity",
  [DocumentType.DIGITAL_SIGNATURE]: "Digital Signature",
};

/**
 * Why each document is worth uploading, stated before it's asked for.
 *
 * Deliberately honest about what happens next: these are collected as inputs
 * for automated checks, and the government registry integrations are not live
 * yet, so nothing here promises instant verification or a specific score
 * change it can't deliver.
 */
const DOCUMENT_BENEFITS: Record<string, string> = {
  [DocumentType.INCORPORATION_CERTIFICATE]: "Confirms your company legally exists. Investors can't wire funds to an unregistered entity.",
  [DocumentType.PAN]: "Ties the company to its tax identity. Kept private, never shown on your profile.",
  [DocumentType.GST]: "Signals active, filing operations rather than a dormant registration.",
  [DocumentType.DPIIT_RECOGNITION]: "Unlocks the government-recognised startup badge and related scheme eligibility.",
  [DocumentType.TRADEMARK]: "Evidence you own your brand — protects against later disputes.",
  [DocumentType.PATENT]: "For deep-tech, defensible IP is often the core of the valuation.",
  [DocumentType.PITCH_DECK]: "The one document every investor asks for. You control exactly who sees it, and access expires.",
  [DocumentType.FINANCIAL_STATEMENT]: "Lets revenue be shown as a verified band instead of a self-reported number.",
  [DocumentType.GOVERNMENT_ID]: "Proves a real founder is behind the profile. Kept private.",
  [DocumentType.DIGITAL_SIGNATURE]: "Speeds up signing once a deal actually moves.",
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_LABELS) as DocumentType[];

interface StepProps {
  defaultValues?: Partial<VerificationStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step8Verification({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const { handleSubmit, watch, setValue } = useForm<VerificationStepInput>({
    resolver: zodResolver(verificationStepSchema),
    defaultValues: { documents: [], ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("verification", 7, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("verification", data);
    onNext();
  });

  const documents = values.documents ?? [];

  const handleUpload = async (type: DocumentType, file: File | undefined) => {
    if (!file) return;
    setUploadingType(type);
    try {
      const fileUrl = await uploadFile(file, "documents");
      const withoutType = documents.filter((doc) => doc.type !== type);
      setValue("documents", [...withoutType, { type, fileUrl, fileName: file.name }]);
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-xl font-semibold text-text-primary">Verification documents</h2>
          <span className="rounded-full bg-background-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
            All optional
          </span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Skip anything you don&apos;t have yet — nothing here blocks you from publishing. Documents are stored privately and used as
          evidence for automated verification, which is the only thing that raises your Trust Score. Typing information never does.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-card border border-border">
        {DOCUMENT_TYPES.map((type) => {
          const uploaded = documents.find((doc) => doc.type === type);
          const isUploading = uploadingType === type;
          return (
            <div key={type} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{DOCUMENT_LABELS[type]}</p>
                {/* The reason comes before the ask — a bare list of document
                    names is what made this step read like a form to fill in
                    rather than a set of choices with a payoff. */}
                <p className="mt-0.5 text-xs text-text-secondary">{DOCUMENT_BENEFITS[type]}</p>
                {uploaded && <p className="mt-1 truncate text-xs font-medium text-success-600">{uploaded.fileName}</p>}
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-background-secondary">
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : uploaded ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploaded ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleUpload(type, e.target.files?.[0])}
                />
              </label>
            </div>
          );
        })}
      </div>

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
