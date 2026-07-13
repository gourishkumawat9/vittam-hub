"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePublishOnboarding } from "@vittamhub/api-client";
import { createServiceProviderInputSchema, ServiceCategory, type CreateServiceProviderInput } from "@vittamhub/types";
import { Input, Textarea } from "@vittamhub/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const CATEGORY_OPTIONS = Object.values(ServiceCategory);

function titleCase(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ServiceProviderInfoStepProps {
  defaultValues?: Partial<CreateServiceProviderInput>;
  onBack: () => void;
}

export function ServiceProviderInfoStep({ defaultValues, onBack }: ServiceProviderInfoStepProps) {
  const router = useRouter();
  const { setSectionData, reset } = useOnboardingStore();
  const publish = usePublishOnboarding();
  const [publishError, setPublishError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateServiceProviderInput>({
    resolver: zodResolver(createServiceProviderInputSchema),
    defaultValues: { categories: [], ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("serviceProviderInfo", 1, values);

  const toggleCategory = (category: ServiceCategory) => {
    const current = values.categories ?? [];
    setValue("categories", current.includes(category) ? current.filter((c) => c !== category) : [...current, category]);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSectionData("serviceProviderInfo", data);
    setPublishError(null);
    try {
      await publish.mutateAsync({});
      reset();
      router.push("/?published=true");
    } catch {
      setPublishError("We couldn't publish your profile. Please check your details and try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Service provider profile</h2>
        <p className="mt-1 text-sm text-text-secondary">Let startups find the services you offer.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Company name" error={errors.companyName?.message} {...register("companyName")} />
        <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Service categories</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                (values.categories ?? []).includes(category)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {titleCase(category)}
            </button>
          ))}
        </div>
        {errors.categories?.message && <p className="text-xs text-danger-600">{errors.categories.message}</p>}
      </div>

      <Textarea label="Description" rows={3} {...register("description")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Pricing model" hint='e.g. "Fixed fee", "Retainer"' error={errors.pricingModel?.message} {...register("pricingModel")} />
        <Input label="Years of experience" type="number" error={errors.yearsExperience?.message} {...register("yearsExperience")} />
        <Input label="Clients served" type="number" error={errors.clientsServed?.message} {...register("clientsServed")} />
      </div>

      {publishError && <p className="text-sm text-danger-600">{publishError}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving" || publish.isPending} nextLabel="Complete profile" />
    </form>
  );
}
