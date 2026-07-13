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
        <h2 className="font-heading text-xl font-semibold text-text-primary">Verification documents</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Upload what you have — verification unlocks discovery visibility. All optional at this stage.
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
                {uploaded && <p className="truncate text-xs text-text-secondary">{uploaded.fileName}</p>}
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
