"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateDiscussion } from "@vittamhub/api-client";
import { COMMUNITY_DOMAINS, createDiscussionInputSchema, Industry, type CreateDiscussionInput } from "@vittamhub/types";
import { Button, Dialog, Input, Select, Textarea } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const COMMUNITY_OPTIONS = Object.values(Industry).map((industry) => ({ value: industry, label: COMMUNITY_DOMAINS[industry].name }));

const KIND_OPTIONS = [
  { value: "QUESTION", label: "Question: I need a solution" },
  { value: "DISCUSSION", label: "Discussion: share or debate" },
];

/** Ask a question or start a discussion. Lands you on the new thread so you see it posted. */
export function AskDialog({
  open,
  onOpenChange,
  defaultIndustry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultIndustry?: Industry;
}) {
  const router = useRouter();
  const create = useCreateDiscussion();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDiscussionInput>({
    resolver: zodResolver(createDiscussionInputSchema),
    defaultValues: { industry: defaultIndustry, kind: "QUESTION", title: "", body: "" },
  });

  useEffect(() => {
    if (open) reset({ industry: defaultIndustry, kind: "QUESTION", title: "", body: "" });
  }, [open, defaultIndustry, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const created = await create.mutateAsync(data);
    onOpenChange(false);
    router.push(`/communities/discussions/${created.id}`);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ask the community"
      description="Be specific: what you tried, what happened, and what a good answer looks like."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={create.isPending}>
            Post
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="industry"
          render={({ field }) => (
            <Select
              label="Community"
              required
              placeholder="Choose a domain"
              options={COMMUNITY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.industry ? "Choose a community" : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="kind"
          render={({ field }) => <Select label="Type" options={KIND_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
        <Input
          label="Title"
          required
          placeholder="e.g. How did you get your first 10 B2B customers in fintech?"
          error={errors.title?.message}
          {...register("title")}
        />
        <Textarea label="Details" required rows={6} error={errors.body?.message} {...register("body")} />
      </form>
    </Dialog>
  );
}
