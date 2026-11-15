"use client";

import { useDeleteDocument, useDocumentDownloadUrl, useDocuments, useUploadDocument, uploadFile } from "@vittamhub/api-client";
import { DocumentType } from "@vittamhub/types";
import { Button, EmptyState, Select, useToast } from "@vittamhub/ui";
import { FolderLock, Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { openFetchedLink } from "@/lib/open-link";

const DOCUMENT_LABELS: Record<string, string> = {
  PITCH_DECK: "Pitch Deck",
  FINANCIAL_STATEMENT: "Financials",
  LEGAL_CONTRACT: "Legal / Contracts",
  CAP_TABLE: "Cap Table",
  DUE_DILIGENCE_REPORT: "Due Diligence",
  MEETING_NOTES: "Meeting Notes",
  INCORPORATION_CERTIFICATE: "Certificate of Incorporation",
  PAN: "PAN",
  GST: "GST",
  DPIIT_RECOGNITION: "DPIIT Recognition",
  TRADEMARK: "Trademark",
  PATENT: "Patent",
  GOVERNMENT_ID: "Government ID",
  DIGITAL_SIGNATURE: "Digital Signature",
  OTHER: "Other",
};

const VAULT_TYPES: DocumentType[] = [
  DocumentType.PITCH_DECK,
  DocumentType.FINANCIAL_STATEMENT,
  DocumentType.LEGAL_CONTRACT,
  DocumentType.CAP_TABLE,
  DocumentType.DUE_DILIGENCE_REPORT,
  DocumentType.MEETING_NOTES,
  DocumentType.OTHER,
];
const TYPE_OPTIONS = VAULT_TYPES.map((value) => ({ label: DOCUMENT_LABELS[value] ?? value, value }));

export default function DocumentVaultPage() {
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const { toast } = useToast();
  const deleteDocument = useDeleteDocument();
  const downloadUrl = useDocumentDownloadUrl();
  const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.PITCH_DECK);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      let fileUrl: string;
      try {
        fileUrl = await uploadFile(file, "documents");
      } catch (cause) {
        // This used to fail without a word: the spinner stopped and nothing was listed.
        toast({
          variant: "error",
          title: "That file couldn't be uploaded",
          description: cause instanceof Error && cause.message ? cause.message : "Please try again.",
        });
        return;
      }
      // A failure here is announced by the app's own error message.
      await uploadDocument.mutateAsync({ type: uploadType, fileUrl, fileName: file.name }).catch(() => undefined);
    } finally {
      setUploading(false);
    }
  };

  // The API never hands out a permanent file URL — each "View" click mints a
  // fresh short-lived signed one via GET /v1/documents/:id/access.
  const handleView = async (documentId: string) => {
    await openFetchedLink(async () => (await downloadUrl.mutateAsync(documentId)).fileUrl);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Document Vault</h1>
        <p className="mt-1 text-sm text-text-secondary">Private storage. Only you can see these documents.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <div className="w-56">
          <Select label="Document type" options={TYPE_OPTIONS} value={uploadType} onChange={(v) => setUploadType(v as DocumentType)} />
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-background-secondary focus-within:ring-2 focus-within:ring-brand-primary">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload file
          <input
            type="file"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Cleared so the same file can be chosen again after a failed try.
              e.target.value = "";
              void handleUpload(file);
            }}
          />
        </label>
      </div>

      {isLoading ? (
        <ListRowsSkeleton />
      ) : documents && documents.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{doc.fileName}</p>
                <p className="text-xs text-text-secondary">{DOCUMENT_LABELS[doc.type] ?? doc.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleView(doc.id)}
                  disabled={downloadUrl.isPending}
                  className="text-xs font-medium text-brand-primary hover:underline disabled:opacity-60"
                >
                  View
                </button>
                <Button size="sm" variant="ghost" onClick={() => deleteDocument.mutate(doc.id)} isLoading={deleteDocument.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderLock} title="No documents yet" description="Upload pitch decks, financials, or contracts to keep them organized here." />
      )}
    </div>
  );
}
