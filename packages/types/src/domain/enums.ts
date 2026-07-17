// Every enum here must stay byte-for-byte in sync with apps/api/src/database/prisma/schema.prisma —
// these are the client-side mirror Zod uses for form validation before the same value ever reaches Prisma.

export const UserRole = {
  FOUNDER: "FOUNDER",
  INVESTOR: "INVESTOR",
  MENTOR: "MENTOR",
  INCUBATOR: "INCUBATOR",
  UNIVERSITY: "UNIVERSITY",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
  JOB_SEEKER: "JOB_SEEKER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const VerificationStatus = {
  UNVERIFIED: "UNVERIFIED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const OnboardingStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;
export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  NON_BINARY: "NON_BINARY",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const DocumentType = {
  INCORPORATION_CERTIFICATE: "INCORPORATION_CERTIFICATE",
  PAN: "PAN",
  GST: "GST",
  DPIIT_RECOGNITION: "DPIIT_RECOGNITION",
  TRADEMARK: "TRADEMARK",
  PATENT: "PATENT",
  PITCH_DECK: "PITCH_DECK",
  FINANCIAL_STATEMENT: "FINANCIAL_STATEMENT",
  GOVERNMENT_ID: "GOVERNMENT_ID",
  DIGITAL_SIGNATURE: "DIGITAL_SIGNATURE",
  CAP_TABLE: "CAP_TABLE",
  LEGAL_CONTRACT: "LEGAL_CONTRACT",
  DUE_DILIGENCE_REPORT: "DUE_DILIGENCE_REPORT",
  MEETING_NOTES: "MEETING_NOTES",
  OTHER: "OTHER",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const StartupStage = {
  IDEA: "IDEA",
  VALIDATION: "VALIDATION",
  PROTOTYPE: "PROTOTYPE",
  MVP: "MVP",
  CUSTOMERS: "CUSTOMERS",
  REVENUE: "REVENUE",
  FUNDED: "FUNDED",
  SCALING: "SCALING",
  UNICORN: "UNICORN",
} as const;
export type StartupStage = (typeof StartupStage)[keyof typeof StartupStage];

export const RegistrationStatus = {
  NOT_REGISTERED: "NOT_REGISTERED",
  IN_PROGRESS: "IN_PROGRESS",
  REGISTERED: "REGISTERED",
} as const;
export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const CompanyType = {
  PRIVATE_LIMITED: "PRIVATE_LIMITED",
  LLP: "LLP",
  PARTNERSHIP: "PARTNERSHIP",
  SOLE_PROPRIETORSHIP: "SOLE_PROPRIETORSHIP",
  PUBLIC_LIMITED: "PUBLIC_LIMITED",
  NOT_REGISTERED: "NOT_REGISTERED",
  OTHER: "OTHER",
} as const;
export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

export const CustomerModel = {
  B2B: "B2B",
  B2C: "B2C",
  D2C: "D2C",
  B2B2C: "B2B2C",
} as const;
export type CustomerModel = (typeof CustomerModel)[keyof typeof CustomerModel];

export const TeamMemberCategory = {
  FOUNDER: "FOUNDER",
  COFOUNDER: "COFOUNDER",
  EMPLOYEE: "EMPLOYEE",
  ADVISOR: "ADVISOR",
  BOARD_MEMBER: "BOARD_MEMBER",
} as const;
export type TeamMemberCategory = (typeof TeamMemberCategory)[keyof typeof TeamMemberCategory];

export const HiringStatus = {
  NOT_HIRING: "NOT_HIRING",
  HIRING: "HIRING",
  OPEN_TO_ADVISORS: "OPEN_TO_ADVISORS",
} as const;
export type HiringStatus = (typeof HiringStatus)[keyof typeof HiringStatus];

export const MilestoneType = {
  IDEA_CREATED: "IDEA_CREATED",
  PROTOTYPE: "PROTOTYPE",
  MVP: "MVP",
  FIRST_CUSTOMER: "FIRST_CUSTOMER",
  REVENUE: "REVENUE",
  SEED_ROUND: "SEED_ROUND",
  AWARD: "AWARD",
  HIRING: "HIRING",
  PRODUCT_LAUNCH: "PRODUCT_LAUNCH",
  OTHER: "OTHER",
} as const;
export type MilestoneType = (typeof MilestoneType)[keyof typeof MilestoneType];

export const PipelineStage = {
  TARGET: "TARGET",
  INTERESTED: "INTERESTED",
  MEETING: "MEETING",
  DUE_DILIGENCE: "DUE_DILIGENCE",
  NEGOTIATION: "NEGOTIATION",
  INVESTED: "INVESTED",
  CLOSED: "CLOSED",
} as const;
export type PipelineStage = (typeof PipelineStage)[keyof typeof PipelineStage];

export const FundingType = {
  BOOTSTRAPPED: "BOOTSTRAPPED",
  GRANT: "GRANT",
  ANGEL: "ANGEL",
  SEED: "SEED",
  SERIES_A: "SERIES_A",
  SERIES_B: "SERIES_B",
  SERIES_C_PLUS: "SERIES_C_PLUS",
} as const;
export type FundingType = (typeof FundingType)[keyof typeof FundingType];

export const LookingForType = {
  INVESTORS: "INVESTORS",
  MENTORS: "MENTORS",
  INCUBATORS: "INCUBATORS",
  ACCELERATORS: "ACCELERATORS",
  SERVICE_PROVIDERS: "SERVICE_PROVIDERS",
  OFFICE_SPACE: "OFFICE_SPACE",
  COFOUNDER: "COFOUNDER",
  EMPLOYEES: "EMPLOYEES",
  GRANTS: "GRANTS",
  GOVERNMENT_SCHEMES: "GOVERNMENT_SCHEMES",
  CORPORATE_PARTNERSHIPS: "CORPORATE_PARTNERSHIPS",
} as const;
export type LookingForType = (typeof LookingForType)[keyof typeof LookingForType];

export const InvestorType = {
  ANGEL: "ANGEL",
  VC_FIRM: "VC_FIRM",
  FAMILY_OFFICE: "FAMILY_OFFICE",
  CORPORATE_VC: "CORPORATE_VC",
  ACCELERATOR: "ACCELERATOR",
} as const;
export type InvestorType = (typeof InvestorType)[keyof typeof InvestorType];

export const SessionType = {
  ONE_ON_ONE: "ONE_ON_ONE",
  GROUP: "GROUP",
  WORKSHOP: "WORKSHOP",
  ADVISORY: "ADVISORY",
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const IncubatorKind = {
  INCUBATOR: "INCUBATOR",
  ACCELERATOR: "ACCELERATOR",
} as const;
export type IncubatorKind = (typeof IncubatorKind)[keyof typeof IncubatorKind];

export const ServiceCategory = {
  LEGAL: "LEGAL",
  FINANCE: "FINANCE",
  CA: "CA",
  MARKETING: "MARKETING",
  BRANDING: "BRANDING",
  TECHNOLOGY: "TECHNOLOGY",
  RECRUITMENT: "RECRUITMENT",
  IP: "IP",
  HR: "HR",
  OPERATIONS: "OPERATIONS",
  OTHER: "OTHER",
} as const;
export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];

export const AvailabilityType = {
  IMMEDIATE: "IMMEDIATE",
  TWO_WEEKS: "TWO_WEEKS",
  ONE_MONTH: "ONE_MONTH",
  FLEXIBLE: "FLEXIBLE",
} as const;
export type AvailabilityType = (typeof AvailabilityType)[keyof typeof AvailabilityType];

export const OtpPurpose = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  LOGIN_MFA: "LOGIN_MFA",
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export const ConnectionStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  IGNORED: "IGNORED",
  WITHDRAWN: "WITHDRAWN",
} as const;
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

export const BookingStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const JobStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const EmploymentType = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACT",
  INTERNSHIP: "INTERNSHIP",
  ADVISORY: "ADVISORY",
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const ApplicationStatus = {
  SUBMITTED: "SUBMITTED",
  SHORTLISTED: "SHORTLISTED",
  REJECTED: "REJECTED",
  HIRED: "HIRED",
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const PostType = {
  FOUNDER_POST: "FOUNDER_POST",
  STARTUP_UPDATE: "STARTUP_UPDATE",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  POLL: "POLL",
  EVENT: "EVENT",
} as const;
export type PostType = (typeof PostType)[keyof typeof PostType];

export const NotificationType = {
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTION_ACCEPTED: "CONNECTION_ACCEPTED",
  PROFILE_VERIFIED: "PROFILE_VERIFIED",
  PROFILE_REJECTED: "PROFILE_REJECTED",
  PROFILE_VIEWED: "PROFILE_VIEWED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  MILESTONE_ADDED: "MILESTONE_ADDED",
  MEETING_SCHEDULED: "MEETING_SCHEDULED",
  NEW_MESSAGE: "NEW_MESSAGE",
  BILLING_ISSUE: "BILLING_ISSUE",
  SYSTEM: "SYSTEM",
  MENTOR_BOOKING_REQUESTED: "MENTOR_BOOKING_REQUESTED",
  MENTOR_BOOKING_RESPONDED: "MENTOR_BOOKING_RESPONDED",
  JOB_APPLICATION_RECEIVED: "JOB_APPLICATION_RECEIVED",
  JOB_APPLICATION_STATUS_CHANGED: "JOB_APPLICATION_STATUS_CHANGED",
  POST_COMMENTED: "POST_COMMENTED",
  FOUNDER_REVIEW_RECEIVED: "FOUNDER_REVIEW_RECEIVED",
  NEW_FOLLOWER: "NEW_FOLLOWER",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const SubscriptionPlan = {
  FREE: "FREE",
  FOUNDER_PRO: "FOUNDER_PRO",
  INVESTOR_PRO: "INVESTOR_PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
