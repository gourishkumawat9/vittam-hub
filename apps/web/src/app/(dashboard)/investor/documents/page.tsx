"use client";

import { useDeleteDocument, useDocumentDownloadUrl, useDocuments, useUploadDocument, uploadFile } from "@vittamhub/api-client";
import { DocumentType } from "@vittamhub/types";
import { Badge, Button, Card, EmptyState, Select, useToast } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { BadgeCheck, CheckCircle2, FileText, FolderLock, Lock, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { UploadButton } from "@/components/documents/UploadButton";
import { openFetchedLink } from "@/lib/open-link";
import { cn } from "@/lib/utils";

const DOCUMENT_LABELS: Record<string, string> = {
  PITCH_DECK: "Pitch deck",
  FINANCIAL_STATEMENT: "Financials",
  LEGAL_CONTRACT: "Legal and contracts",
  CAP_TABLE: "Cap table",
  DUE_DILIGENCE_REPORT: "Due diligence",
  MEETING_NOTES: "Meeting notes",
  INCORPORATION_CERTIFICATE: "Certificate of Incorporation",
  PAN: "PAN",
  GST: "GST",
  DPIIT_RECOGNITION: "DPIIT recognition",
  TRADEMARK: "Trademark",
  PATENT: "Patent",
  GOVERNMENT_ID: "Government ID",
  DIGITAL_SIGNATURE: "Digital signature",
  UDYAM_REGISTRATION: "Udyam (MSME) registration",
  STUDENT_ID: "Student ID",
  SEBI_REGISTRATION: "SEBI registration",
  ACCREDITED_INVESTOR_CERTIFICATE: "Accredited investor certificate",
  SCHEME_SANCTION_LETTER: "Scheme sanction letter",
  AUTHORIZATION_LETTER: "Authorisation letter",
  OTHER: "Other",
};

/** Deal papers an investor keeps for themselves while looking at a startup. */
const DEAL_TYPES: DocumentType[] = [
  DocumentType.DUE_DILIGENCE_REPORT,
  DocumentType.MEETING_NOTES,
  DocumentType.LEGAL_CONTRACT,
  DocumentType.FINANCIAL_STATEMENT,
  DocumentType.CAP_TABLE,
  DocumentType.PITCH_DECK,
  DocumentType.OTHER,
];

/**
 * The investor's own credentials, each optional. Collected now as inputs for
 * automated checks later (CLAUDE.md §7); nobody reviews them by hand.
 */
const CREDENTIALS: { type: DocumentType; hint: string }[] = [
  { type: DocumentType.SEBI_REGISTRATION, hint: "If you invest through a registered fund or AIF" },
  { type: DocumentType.ACCREDITED_INVESTOR_CERTIFICATE, hint: "If you're accredited under SEBI's framework" },
  { type: DocumentType.AUTHORIZATION_LETTER, hint: "If you invest on behalf of a firm or family office" },
];

const TYPE_OPTIONS = [...DEAL_TYPES, ...CREDENTIALS.map((c) => c.type)].map((value) => ({ label: DOCUMENT_LABELS[value] ?? value, value }));

export default function DocumentVaultPage() {
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const { toast } = useToast();
  const deleteDocument = useDeleteDocument();
  const downloadUrl = useDocumentDownloadUrl();
  const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.DUE_DILIGENCE_REPORT);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const handleUpload = async (file: File | undefined, type: DocumentType) => {
    if (!file) return;
    setUploadingType(type);
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
      await uploadDocument
        .mutateAsync({ type, fileUrl, fileName: file.name })
        .then(() => toast({ variant: "success", title: `${DOCUMENT_LABELS[type] ?? "Document"} uploaded`, description: "Only you can open it." }))
        .catch(() => undefined);
    } finally {
      setUploadingType(null);
    }
  };

  // The API never hands out a permanent file URL: each "View" mints a fresh short-lived signed one.
  const view = (id: string) => void openFetchedLink(async () => (await downloadUrl.mutateAsync(id)).fileUrl);
  const all = [...(documents ?? [])].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const latestOf = (type: DocumentType) => all.find((doc) => doc.type === type);
  const busy = uploadingType !== null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Documents"
        description="Your private files: diligence notes, meeting notes and deal papers, and your own credentials. Only you can open them."
        meta={!isLoading && <Badge variant="neutral">{all.length === 1 ? "1 file" : `${all.length} files`}</Badge>}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Every file, newest first. */}
        <Card className="flex flex-col gap-5 lg:col-span-2">
          <PanelTitle as="h2" icon={FolderLock} title="Your files" />
          <div className="flex flex-wrap items-end gap-3 rounded-button bg-background-secondary p-4">
            <div className="w-full sm:w-56">
              <Select label="Document type" options={TYPE_OPTIONS} value={uploadType} onChange={(v) => setUploadType(v as DocumentType)} />
            </div>
            <UploadButton
              label="Upload file"
              variant="primary"
              busy={uploadingType === uploadType}
              disabled={busy}
              onFile={(file) => void handleUpload(file, uploadType)}
            />
            <p className="flex items-center gap-1.5 caption-5 sm:ml-auto">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Stored privately
            </p>
          </div>

          {isLoading ? (
            <ListRowsSkeleton />
          ) : all.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {all.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate body-5 text-text-primary" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                      <span className="caption-5">
                        {DOCUMENT_LABELS[doc.type] ?? doc.type} · {formatRelativeTime(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={downloadUrl.isPending} onClick={() => view(doc.id)}>
                      View
                    </Button>
                    <button
                      type="button"
                      onClick={() => deleteDocument.mutate(doc.id)}
                      className="rounded-button p-2 text-text-secondary hover:bg-background-secondary hover:text-danger-600"
                      aria-label={`Delete ${doc.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={FolderLock}
              title="No files yet"
              description="Keep your diligence notes, meeting notes and term sheets here, next to the startups you're looking at."
              className="py-8"
            />
          )}
        </Card>

        {/* The investor's own credentials, each optional. */}
        <section className="flex flex-col gap-4" aria-labelledby="credentials-heading">
          <div className="flex flex-col gap-1">
            <h2 id="credentials-heading" className="title-2">
              Your credentials
            </h2>
            <p className="caption-5">Optional. They stay private and are kept for automated checks as those are added.</p>
          </div>
          {CREDENTIALS.map((slot) => {
            const doc = latestOf(slot.type);
            return (
              <Card key={slot.type} className={cn("flex items-start gap-3", !doc && "border-dashed")}>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    doc ? "bg-success-50 text-success-600 dark:bg-success-500/10" : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200",
                  )}
                >
                  {doc ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <BadgeCheck className="h-4 w-4" aria-hidden="true" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="title-3">{DOCUMENT_LABELS[slot.type]}</h3>
                    {doc ? (
                      <p className="caption-5 truncate" title={doc.fileName}>
                        {doc.fileName} · {formatRelativeTime(doc.uploadedAt)}
                      </p>
                    ) : (
                      <p className="caption-5">{slot.hint}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doc && (
                      <Button size="sm" variant="secondary" onClick={() => view(doc.id)} disabled={downloadUrl.isPending}>
                        View
                      </Button>
                    )}
                    <UploadButton
                      label={doc ? "Replace" : "Upload"}
                      busy={uploadingType === slot.type}
                      disabled={busy}
                      onFile={(file) => void handleUpload(file, slot.type)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
          <Card className="flex items-start gap-3 bg-background-secondary">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
            <p className="caption-5">
              Your Verified badge asks for a government ID and a filled-in profile.{" "}
              <Link href="/settings#verification" className="font-medium text-brand-primary hover:underline">
                See what&apos;s left in Settings
              </Link>
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
