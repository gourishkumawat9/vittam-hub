"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile, useSendConnectionRequest, type InvestorWithOwner } from "@vittamhub/api-client";
import { createConnectionInputSchema, type CreateConnectionInput } from "@vittamhub/types";
import { Button, Dialog, Input, Textarea } from "@vittamhub/ui";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface SendConnectRequestDialogProps {
  investor: InvestorWithOwner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The only channel a founder has to reach an investor — see docs/12-connect-requests.md. */
export function SendConnectRequestDialog({ investor, open, onOpenChange }: SendConnectRequestDialogProps) {
  const sendRequest = useSendConnectionRequest();
  const [uploadingField, setUploadingField] = useState<"pitchDeckUrl" | "executiveSummaryUrl" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateConnectionInput>({
    resolver: zodResolver(createConnectionInputSchema),
    defaultValues: { recipientId: investor.ownerId },
  });

  const values = watch();

  const handleUpload = async (field: "pitchDeckUrl" | "executiveSummaryUrl", file: File | undefined) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadFile(file, "documents");
      setValue(field, url);
    } finally {
      setUploadingField(null);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await sendRequest.mutateAsync({ ...data, recipientId: investor.ownerId });
      setSent(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Couldn't send your connect request.");
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setSent(false);
      setSubmitError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={sent ? "Request sent" : `Connect with ${investor.owner.fullName}`}
      description={
        sent
          ? undefined
          : `${investor.firmName ?? "Independent investor"} will see your introduction and can accept, decline, or ignore it.`
      }
      footer={
        sent ? (
          <Button onClick={() => handleOpenChange(false)}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={sendRequest.isPending}>
              Send request
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-sm text-text-secondary">
          You&apos;ll be notified here if {investor.owner.fullName} responds — direct messaging unlocks once they accept.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Textarea
            label="Introduction"
            hint="Who you are, what you're building, and why this investor specifically."
            rows={4}
            error={errors.introduction?.message}
            {...register("introduction")}
          />

          <Input
            label="Funding requirement (USD)"
            type="number"
            hint="Optional — what you're currently raising."
            error={errors.fundingRequirementUsd?.message}
            {...register("fundingRequirementUsd")}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Pitch deck (optional)</label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-2 text-xs font-medium text-text-primary hover:bg-background-secondary">
                {uploadingField === "pitchDeckUrl" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {values.pitchDeckUrl ? "Replace file" : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleUpload("pitchDeckUrl", e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Executive summary (optional)</label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-2 text-xs font-medium text-text-primary hover:bg-background-secondary">
                {uploadingField === "executiveSummaryUrl" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {values.executiveSummaryUrl ? "Replace file" : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleUpload("executiveSummaryUrl", e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <Input
            label="Demo link (optional)"
            placeholder="https://…"
            hint="A live product demo, video walkthrough, or Loom link."
            error={errors.demoLinkUrl?.message}
            {...register("demoLinkUrl")}
          />

          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      )}
    </Dialog>
  );
}
