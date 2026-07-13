"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerModel, marketStepSchema, type MarketStepInput } from "@vittamhub/types";
import { Input, TagsInput, Textarea } from "@vittamhub/ui";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const CUSTOMER_MODEL_OPTIONS = Object.values(CustomerModel);

interface StepProps {
  defaultValues?: Partial<MarketStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Market({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MarketStepInput>({
    resolver: zodResolver(marketStepSchema),
    defaultValues: { targetGeography: [], customerModel: [], customerPersonas: [], competitors: [], ...defaultValues },
  });

  const personas = useFieldArray({ control, name: "customerPersonas" });
  const competitors = useFieldArray({ control, name: "competitors" });

  const values = watch();
  const { status } = useAutosave("market", 3, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("market", data);
    onNext();
  });

  const toggleCustomerModel = (model: CustomerModel) => {
    const current = values.customerModel ?? [];
    setValue("customerModel", current.includes(model) ? current.filter((m) => m !== model) : [...current, model]);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Market details</h2>
        <p className="mt-1 text-sm text-text-secondary">Who you serve and how you win against alternatives.</p>
      </div>

      <Textarea label="Target audience" rows={2} error={errors.targetAudience?.message} {...register("targetAudience")} />

      <Controller
        control={control}
        name="targetGeography"
        render={({ field }) => (
          <TagsInput label="Target geography" value={field.value ?? []} onChange={field.onChange} placeholder="e.g. United States, India…" />
        )}
      />

      <Input label="Primary customer" hint="Who specifically buys or uses your product" {...register("primaryCustomer")} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">Customer model</span>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_MODEL_OPTIONS.map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => toggleCustomerModel(model)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                (values.customerModel ?? []).includes(model)
                  ? "border-brand-primary bg-brand-100 text-brand-700"
                  : "border-border text-text-secondary hover:bg-background-secondary"
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="TAM (USD)" type="number" {...register("tamUsd")} />
        <Input label="SAM (USD)" type="number" {...register("samUsd")} />
        <Input label="SOM (USD)" type="number" {...register("somUsd")} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Customer personas</span>
          <button
            type="button"
            onClick={() => personas.append({ name: "", description: "" })}
            className="flex items-center gap-1 text-sm font-medium text-brand-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add persona
          </button>
        </div>
        {personas.fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 rounded-card border border-border p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Persona name" {...register(`customerPersonas.${index}.name`)} />
              <Input placeholder="Short description" {...register(`customerPersonas.${index}.description`)} />
            </div>
            <button type="button" onClick={() => personas.remove(index)} aria-label="Remove persona" className="text-text-secondary hover:text-danger-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Competitors</span>
          <button
            type="button"
            onClick={() => competitors.append({ name: "", differentiator: "" })}
            className="flex items-center gap-1 text-sm font-medium text-brand-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add competitor
          </button>
        </div>
        {competitors.fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 rounded-card border border-border p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Competitor name" {...register(`competitors.${index}.name`)} />
              <Input placeholder="How you differentiate" {...register(`competitors.${index}.differentiator`)} />
            </div>
            <button type="button" onClick={() => competitors.remove(index)} aria-label="Remove competitor" className="text-text-secondary hover:text-danger-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Textarea label="Competitive advantage" rows={2} {...register("competitiveAdvantage")} />
      <Textarea label="Go-to-market strategy" rows={2} {...register("goToMarketStrategy")} />

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
