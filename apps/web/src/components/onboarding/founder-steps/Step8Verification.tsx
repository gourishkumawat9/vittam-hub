"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@vittamhub/api-client";
import { DocumentType, verificationStepSchema, type VerificationStepInput } from "@vittamhub/types";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";
import { FieldSection, MoreDetails, StepHeader } from "../fields";

const DOCUMENT_LABELS: Record<string, string> = {
  [DocumentType.PITCH_DECK]: "Pitch deck",
  [DocumentType.INCORPORATION_CERTIFICATE]: "Certificate of Incorporation",
  [DocumentType.DPIIT_RECOGNITION]: "DPIIT recognition",
  [DocumentType.PAN]: "Company PAN",
  [DocumentType.GST]: "GST certificate",
  [DocumentType.UDYAM_REGISTRATION]: "Udyam (MSME) registration",
  [DocumentType.TRADEMARK]: "Trademark",
  [DocumentType.PATENT]: "Patent",
  [DocumentType.FINANCIAL_STATEMENT]: "Financial statements",
  [DocumentType.GOVERNMENT_ID]: "Founder identity",
  [DocumentType.DIGITAL_SIGNATURE]: "Digital signature",
  [DocumentType.STUDENT_ID]: "Student ID card",
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
  [DocumentType.TRADEMARK]: "Evidence you own your brand, which protects against later disputes.",
  [DocumentType.PATENT]: "For deep-tech, defensible IP is often the core of the valuation.",
  [DocumentType.PITCH_DECK]: "The one document every investor asks for. Kept private, never shown on your public page.",
  [DocumentType.FINANCIAL_STATEMENT]: "Lets revenue be shown as a verified band instead of a self-reported number.",
  [DocumentType.GOVERNMENT_ID]: "Proves a real founder is behind the profile. Kept private.",
  [DocumentType.DIGITAL_SIGNATURE]: "Speeds up signing once a deal actually moves.",
  [DocumentType.UDYAM_REGISTRATION]: "Shows the business is registered as an MSME, which many grants and schemes ask for.",
  [DocumentType.STUDENT_ID]: "For student founders: some campus and government programmes are only open to students. Kept private.",
};

/** Asked first: what investors open first, and what proves the company exists. The rest can wait. */
const KEY_DOCUMENTS: DocumentType[] = [DocumentType.PITCH_DECK, DocumentType.INCORPORATION_CERTIFICATE, DocumentType.DPIIT_RECOGNITION];
const OTHER_DOCUMENTS = (Object.keys(DOCUMENT_LABELS) as DocumentType[]).filter((type) => !KEY_DOCUMENTS.includes(type));

interface StepProps {
  defaultValues?: Partial<VerificationStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step8Verification({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { handleSubmit, watch, setValue } = useForm<VerificationStepInput>({
    resolver: zodResolver(verificationStepSchema),
    defaultValues: { documents: [], ...defaultValues },
  });

  const values = watch();
  useAutosave("verification", 9, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("verification", data);
    onNext();
  });

  const documents = values.documents ?? [];

  const handleUpload = async (type: DocumentType, file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploadingType(type);
    try {
      const fileUrl = await uploadFile(file, "documents");
      const withoutType = documents.filter((doc) => doc.type !== type);
      setValue("documents", [...withoutType, { type, fileUrl, fileName: file.name }]);
    } catch (cause) {
      // This failed without a word before: the spinner stopped and the document simply wasn't there.
      const label = DOCUMENT_LABELS[type] ?? "That document";
      setUploadError(`${label} couldn't be uploaded. ${cause instanceof Error && cause.message ? cause.message : "Please try again."}`);
    } finally {
      setUploadingType(null);
    }
  };

  const renderRow = (type: DocumentType) => {
    const uploaded = documents.find((doc) => doc.type === type);
    const isUploading = uploadingType === type;
    return (
      <li key={type} className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          {uploaded ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-label="Uploaded" />
          ) : (
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="title-4">{DOCUMENT_LABELS[type]}</p>
            {/* The reason comes before the ask: a bare list of document names read like a form to fill in. */}
            <p className="caption-5 mt-0.5">{DOCUMENT_BENEFITS[type]}</p>
            {uploaded && <p className="mt-1 truncate text-xs font-medium text-success-700">{uploaded.fileName}</p>}
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-background-secondary focus-within:ring-2 focus-within:ring-brand-primary">
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
          {uploaded ? "Replace" : "Upload"}
          <span className="sr-only">{DOCUMENT_LABELS[type]}</span>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={uploadingType !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void handleUpload(type, file);
            }}
          />
        </label>
      </li>
    );
  };

  const othersUploaded = OTHER_DOCUMENTS.filter((type) => documents.some((doc) => doc.type === type)).length;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <StepHeader
        optional
        title="Documents"
        description="Nothing here blocks publishing. Documents are stored privately and used for automated checks and your Verified badge, never shown on your public page."
      />

      <FieldSection title="Start with these" description="What investors open first, and what shows the company exists.">
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">{KEY_DOCUMENTS.map(renderRow)}</ul>
      </FieldSection>

      <MoreDetails
        title="More documents"
        description={othersUploaded > 0 ? `${othersUploaded} added. Add the rest when you have them.` : "PAN, GST, trademark, patent, financials and identity. Add them when you have them."}
        defaultOpen={othersUploaded > 0}
      >
        <ul className="-mx-4 -my-5 flex flex-col divide-y divide-border">{OTHER_DOCUMENTS.map(renderRow)}</ul>
      </MoreDetails>

      {uploadError && (
        <p className="text-sm text-danger-600" role="alert">
          {uploadError}
        </p>
      )}

      <WizardNav onBack={onBack} onNext={onSubmit} backLabel="Back to review" nextLabel="Save and review" />
    </form>
  );
}
