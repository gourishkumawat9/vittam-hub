"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@vittamhub/api-client";
import { productStepSchema, type ProductStepInput } from "@vittamhub/types";
import { Checkbox, Input, TagsInput, Textarea } from "@vittamhub/ui";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

interface StepProps {
  defaultValues?: Partial<ProductStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Product({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
  } = useForm<ProductStepInput>({
    resolver: zodResolver(productStepSchema),
    defaultValues: { screenshots: [], technologyStack: [], hasApi: false, ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("product", 2, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("product", data);
    onNext();
  });

  const handleScreenshotUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingScreenshot(true);
    try {
      const url = await uploadFile(file, "documents");
      setValue("screenshots", [...(values.screenshots ?? []), url]);
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Product details</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Optional if you&apos;re still pre-product — fill in what applies today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Product name" {...register("productName")} />
        <Input label="Current version" placeholder="e.g. v1.2.0" {...register("currentVersion")} />
      </div>
      <Textarea label="Product description" rows={3} {...register("description")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Website" placeholder="https://…" {...register("website")} />
        <Input label="App Store link" placeholder="https://apps.apple.com/…" {...register("appStoreUrl")} />
        <Input label="Play Store link" placeholder="https://play.google.com/…" {...register("playStoreUrl")} />
        <Input label="Demo video" placeholder="https://…" {...register("demoVideoUrl")} />
        <Input label="Pitch video" placeholder="https://…" {...register("pitchVideoUrl")} />
      </div>

      <Controller
        control={control}
        name="technologyStack"
        render={({ field }) => (
          <TagsInput label="Technology stack" value={field.value ?? []} onChange={field.onChange} placeholder="e.g. React, Postgres…" />
        )}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Screenshots</span>
        <div className="flex flex-wrap gap-3">
          {(values.screenshots ?? []).map((url) => (
            <div key={url} className="relative h-20 w-32 overflow-hidden rounded-card border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded remote URL */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setValue("screenshots", (values.screenshots ?? []).filter((s) => s !== url))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white"
                aria-label="Remove screenshot"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex h-20 w-32 cursor-pointer items-center justify-center rounded-card border border-dashed border-border text-xs text-text-secondary hover:bg-background-secondary">
            {isUploadingScreenshot ? <Loader2 className="h-4 w-4 animate-spin" /> : "+ Add"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleScreenshotUpload(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <Controller
        control={control}
        name="hasApi"
        render={({ field }) => (
          <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} label="We offer a public API" />
        )}
      />

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
