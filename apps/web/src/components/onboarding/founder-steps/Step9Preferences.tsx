"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LookingForType, preferencesStepSchema, type PreferencesStepInput } from "@vittamhub/types";
import {
  Banknote,
  Briefcase,
  Building,
  Building2,
  Handshake,
  Landmark,
  MapPin,
  UserSearch,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const OPTIONS: { value: LookingForType; label: string; icon: LucideIcon }[] = [
  { value: LookingForType.INVESTORS, label: "Investors", icon: Handshake },
  { value: LookingForType.MENTORS, label: "Mentors", icon: Users },
  { value: LookingForType.INCUBATORS, label: "Incubators", icon: Building },
  { value: LookingForType.ACCELERATORS, label: "Accelerators", icon: Building2 },
  { value: LookingForType.SERVICE_PROVIDERS, label: "Service providers", icon: Wrench },
  { value: LookingForType.OFFICE_SPACE, label: "Office space", icon: MapPin },
  { value: LookingForType.COFOUNDER, label: "Co-founder", icon: UserSearch },
  { value: LookingForType.EMPLOYEES, label: "Employees", icon: Briefcase },
  { value: LookingForType.GRANTS, label: "Grants", icon: Banknote },
  { value: LookingForType.GOVERNMENT_SCHEMES, label: "Government schemes", icon: Landmark },
  { value: LookingForType.CORPORATE_PARTNERSHIPS, label: "Corporate partnerships", icon: Handshake },
];

interface StepProps {
  defaultValues?: Partial<PreferencesStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step9Preferences({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesStepInput>({
    resolver: zodResolver(preferencesStepSchema),
    defaultValues: { lookingFor: [], ...defaultValues },
  });

  const values = watch();
  const { status } = useAutosave("preferences", 8, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("preferences", data);
    onNext();
  });

  const toggle = (value: LookingForType) => {
    const current = values.lookingFor ?? [];
    setValue("lookingFor", current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">What are you looking for?</h2>
        <p className="mt-1 text-sm text-text-secondary">Select everything relevant — this drives your discovery matches.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const isSelected = (values.lookingFor ?? []).includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`flex flex-col items-center gap-2 rounded-card border-2 p-4 text-center transition-colors ${
                isSelected ? "border-brand-primary bg-brand-100" : "border-border hover:bg-background-secondary"
              }`}
            >
              <option.icon className={`h-5 w-5 ${isSelected ? "text-brand-700" : "text-text-secondary"}`} aria-hidden="true" />
              <span className={`text-xs font-medium ${isSelected ? "text-brand-700" : "text-text-primary"}`}>{option.label}</span>
            </button>
          );
        })}
      </div>
      {errors.lookingFor?.message && <p className="text-xs text-danger-600">{errors.lookingFor.message}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
