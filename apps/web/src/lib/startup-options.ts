/**
 * How each stored startup choice reads to a person. The enums are stored in
 * capitals ("FIRST_REVENUE"); title-casing them gave "Ai Ml" and "Pe", so
 * every picker and summary reads its words from here instead.
 */

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

export const STAGE_LABEL: Record<string, string> = {
  IDEA: "Idea",
  VALIDATION: "Validation",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  CUSTOMERS: "Early customers",
  REVENUE: "Revenue",
  FUNDED: "Funded",
  SCALING: "Scaling",
  UNICORN: "Unicorn",
};

export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  CONCEPT: "Concept",
  PROTOTYPE: "Prototype",
  BETA: "Beta",
  LIVE: "Live",
  SCALED: "Scaled",
};

export const REVENUE_STATUS_LABEL: Record<string, string> = {
  NONE: "No revenue yet",
  PILOT: "Pilots",
  FIRST_REVENUE: "First revenue",
  RECURRING: "Recurring revenue",
  PROFITABLE: "Profitable",
};

export const FUNDING_STATUS_LABEL: Record<string, string> = {
  BOOTSTRAPPED: "Bootstrapped",
  ANGEL: "Angel",
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C_PLUS: "Series C or later",
  PE: "Private equity",
  PUBLIC: "Listed",
};

export const REGISTRATION_LABEL: Record<string, string> = {
  NOT_REGISTERED: "Not yet",
  IN_PROGRESS: "In progress",
  REGISTERED: "Registered",
};

export const COMPANY_TYPE_LABEL: Record<string, string> = {
  PRIVATE_LIMITED: "Private limited",
  LLP: "LLP",
  PARTNERSHIP: "Partnership",
  SOLE_PROPRIETORSHIP: "Sole proprietorship",
  PUBLIC_LIMITED: "Public limited",
  ONE_PERSON_COMPANY: "One person company",
  SECTION_8_COMPANY: "Section 8 company",
  COOPERATIVE_SOCIETY: "Cooperative society",
  NOT_REGISTERED: "Not registered",
  OTHER: "Other",
};

export const INDUSTRY_LABEL: Record<string, string> = {
  FINTECH: "Fintech",
  HEALTHTECH: "Healthtech",
  EDTECH: "Edtech",
  AGRITECH: "Agritech",
  ECOMMERCE: "Ecommerce",
  SAAS: "SaaS",
  DEEPTECH: "Deeptech",
  AI_ML: "AI and machine learning",
  LOGISTICS: "Logistics",
  MOBILITY: "Mobility",
  REAL_ESTATE: "Real estate",
  MEDIA_ENTERTAINMENT: "Media and entertainment",
  GAMING: "Gaming",
  CLEANTECH_CLIMATE: "Cleantech and climate",
  FOODTECH: "Foodtech",
  RETAIL_D2C: "Retail and D2C",
  TRAVEL_HOSPITALITY: "Travel and hospitality",
  HR_TECH: "HR tech",
  LEGAL_TECH: "Legal tech",
  INSURTECH: "Insurtech",
  SPACE_TECH: "Space tech",
  MANUFACTURING: "Manufacturing",
  CONSTRUCTION_PROPTECH: "Construction and proptech",
  SOCIAL_IMPACT: "Social impact",
  ADTECH: "Adtech",
  CYBERSECURITY: "Cybersecurity",
  WEB3_BLOCKCHAIN: "Web3 and blockchain",
  OTHER: "Other",
};

export const LOOKING_FOR_LABEL: Record<string, string> = {
  INVESTORS: "Investors",
  MENTORS: "Mentors",
  INCUBATORS: "Incubators",
  ACCELERATORS: "Accelerators",
  SERVICE_PROVIDERS: "Service providers",
  OFFICE_SPACE: "Office space",
  COFOUNDER: "A cofounder",
  EMPLOYEES: "Employees",
  GRANTS: "Grants and programmes",
  GOVERNMENT_SCHEMES: "Government schemes",
  CORPORATE_PARTNERSHIPS: "Corporate partnerships",
};

/** Turns a label map into picker options, in the map's own order. */
export function optionsFrom<T extends string>(labels: Record<string, string>): ChoiceOption<T>[] {
  return Object.entries(labels).map(([value, label]) => ({ value: value as T, label }));
}

/** The label for a stored value, falling back to a readable form of the value itself. */
export function labelFor(labels: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "";
  return labels[value] ?? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}
