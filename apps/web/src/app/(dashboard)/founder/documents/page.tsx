"use client";

import { useDeleteDocument, useDocumentDownloadUrl, useDocuments, useUploadDocument, uploadFile } from "@vittamhub/api-client";
import { DocumentType } from "@vittamhub/types";
import { Badge, Button, Card, EmptyState, Select, useToast } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { CheckCircle2, ChevronDown, FileText, FolderLock, Lock, Trash2 } from "lucide-react";
import { useState } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader, PanelTitle } from "@/components/dashboard/PageHeader";
import { DocumentAccessPanel } from "@/components/dashboard/founder/DocumentAccessPanel";
import { UploadButton } from "@/components/documents/UploadButton";
import { openFetchedLink } from "@/lib/open-link";
import { cn } from "@/lib/utils";

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
  UDYAM_REGISTRATION: "Udyam (MSME) Registration",
  STUDENT_ID: "Student ID",
  SEBI_REGISTRATION: "SEBI Registration",
  ACCREDITED_INVESTOR_CERTIFICATE: "Accredited Investor Certificate",
  SCHEME_SANCTION_LETTER: "Scheme Sanction Letter",
  AUTHORIZATION_LETTER: "Authorisation Letter",
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

// Only these types make sense to share via the permissioned data room — legal
// identity docs (GOVERNMENT_ID, PAN, ...) are for the automated verification
// pipeline (CLAUDE.md §7), never handed to an investor directly.
const SHAREABLE_TYPES = new Set<string>([
  DocumentType.PITCH_DECK,
  DocumentType.FINANCIAL_STATEMENT,
  DocumentType.LEGAL_CONTRACT,
  DocumentType.CAP_TABLE,
  DocumentType.DUE_DILIGENCE_REPORT,
  DocumentType.MEETING_NOTES,
]);

/** The four documents investors ask for first, each with its own slot. */
const DATA_ROOM: { type: DocumentType; hint: string }[] = [
  { type: DocumentType.PITCH_DECK, hint: "The deck you'd send after a first call" },
  { type: DocumentType.FINANCIAL_STATEMENT, hint: "P&L, burn and runway, even if early" },
  { type: DocumentType.CAP_TABLE, hint: "Who owns what today" },
  { type: DocumentType.LEGAL_CONTRACT, hint: "Incorporation, founder agreements, key contracts" },
];

/**
 * The founder's data room: a slot for each document investors ask for first,
 * then every file with who it's shared with. Everything is private until the
 * founder shares it with one investor, and that access expires by itself.
 */
export default function FounderDocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const { toast } = useToast();
  const deleteDocument = useDeleteDocument();
  const downloadUrl = useDocumentDownloadUrl();
  const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.PITCH_DECK);
  // Which type is uploading right now; one at a time.
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        .then(() => toast({ variant: "success", title: `${DOCUMENT_LABELS[type] ?? "Document"} uploaded`, description: "It stays private until you share it." }))
        .catch(() => undefined);
    } finally {
      setUploadingType(null);
    }
  };

  const view = (id: string) => void openFetchedLink(async () => (await downloadUrl.mutateAsync(id)).fileUrl);
  const latestOf = (type: DocumentType) =>
    (documents ?? []).filter((doc) => doc.type === type).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  const readyCount = DATA_ROOM.filter((slot) => latestOf(slot.type)).length;
  // One blue button on the page: the first document still missing.
  const nextMissing = DATA_ROOM.find((slot) => !latestOf(slot.type))?.type;
  const busy = uploadingType !== null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Documents"
        description="Your data room. Everything here is private until you share it with one investor, and that access ends by itself after 14 days."
        meta={
          !isLoading && (
            <Badge variant={readyCount === DATA_ROOM.length ? "success" : "neutral"}>
              {readyCount} of {DATA_ROOM.length} key documents ready
            </Badge>
          )
        }
      />

      {/* 1. The documents investors ask for first. */}
      <section className="flex flex-col gap-4" aria-labelledby="data-room-heading">
        <h2 id="data-room-heading" className="title-2">
          What investors ask for first
        </h2>
        {isLoading ? (
          <ListRowsSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {DATA_ROOM.map((slot) => {
              const doc = latestOf(slot.type);
              const label = DOCUMENT_LABELS[slot.type] ?? slot.type;
              return (
                // A row on phones, a tile from tablet width up.
                <Card key={slot.type} className={cn("flex items-center gap-4 sm:flex-col sm:items-stretch", !doc && "border-dashed")}>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        doc ? "bg-success-50 text-success-600 dark:bg-success-500/10" : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200",
                      )}
                    >
                      {doc ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
                    </span>
                    {doc && (
                      <Badge variant="success" className="hidden sm:inline-flex">
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="title-3">{label}</h3>
                    {doc ? (
                      <p className="caption-5 truncate" title={doc.fileName}>
                        {doc.fileName} · {formatRelativeTime(doc.uploadedAt)}
                      </p>
                    ) : (
                      <p className="caption-5">{slot.hint}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:mt-auto">
                    {doc ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => view(doc.id)} disabled={downloadUrl.isPending}>
                          View
                        </Button>
                        <UploadButton
                          label="Replace"
                          busy={uploadingType === slot.type}
                          disabled={busy}
                          onFile={(file) => void handleUpload(file, slot.type)}
                        />
                      </>
                    ) : (
                      <UploadButton
                        label="Upload"
                        variant={slot.type === nextMissing ? "primary" : "secondary"}
                        busy={uploadingType === slot.type}
                        disabled={busy}
                        onFile={(file) => void handleUpload(file, slot.type)}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Every file, with who can open it. */}
      <Card className="flex flex-col gap-5">
        <PanelTitle as="h2" icon={FolderLock} title="All documents" />
        <div className="flex flex-wrap items-end gap-3 rounded-button bg-background-secondary p-4">
          <div className="w-full sm:w-56">
            <Select label="Add another document" options={TYPE_OPTIONS} value={uploadType} onChange={(v) => setUploadType(v as DocumentType)} />
          </div>
          <UploadButton
            label="Upload file"
            busy={uploadingType === uploadType}
            disabled={busy}
            onFile={(file) => void handleUpload(file, uploadType)}
          />
          <p className="flex items-center gap-1.5 caption-5 sm:ml-auto">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Stored privately. Only you can open it until you share it.
          </p>
        </div>

        {isLoading ? (
          <ListRowsSkeleton />
        ) : documents && documents.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate body-5 text-text-primary">{doc.fileName}</span>
                      <span className="caption-5">
                        {DOCUMENT_LABELS[doc.type] ?? doc.type} · {formatRelativeTime(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* A founder had no way to open a file they had uploaded. */}
                    <Button variant="ghost" size="sm" disabled={downloadUrl.isPending} onClick={() => view(doc.id)}>
                      View
                    </Button>
                    {SHAREABLE_TYPES.has(doc.type) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                        aria-expanded={expandedId === doc.id}
                        className="gap-1"
                      >
                        Manage access <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedId === doc.id ? "rotate-180" : ""}`} />
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteDocument.mutate(doc.id)}
                      className="rounded-button p-2 text-text-secondary hover:bg-background-secondary hover:text-danger-600"
                      aria-label={`Delete ${doc.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {expandedId === doc.id && <DocumentAccessPanel documentId={doc.id} />}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={FolderLock}
            title="No documents yet"
            description="Start with your pitch deck. Investors can open it only after you share it with them."
            className="py-8"
          />
        )}
      </Card>
    </div>
  );
}
