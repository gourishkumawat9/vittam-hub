import { MemberPersona, UserRole } from "./enums";
import { isOrganisationPersona } from "./signup";

/**
 * Profile strength: how much of the profile a member has filled in, shown as
 * a percentage from the moment they sign up. The owner asked for a short
 * sign-up that leaves the profile "about 20% complete", followed by the rest
 * of the questions that make a great profile (November 2026). So the sign-up
 * answers are worth 20% between them and every other question shares the
 * other 80% equally.
 *
 * One function, used by the API (dashboard cards) and by the web wizard (a
 * meter that moves as people type), so the two can never disagree. It reads
 * the wizard's draft shape (`personalDetails`, `startupInfo`, `mentorInfo`, …),
 * which the API rebuilds from a live profile with draftFromPublishedProfile.
 *
 * This is separate from a startup's ProfileCompletion (the seven checks that
 * feed the trust score and the automatic verified badge), which is unchanged.
 */

export const SIGNUP_SHARE_PERCENT = 20;

export interface ProfileQuestion {
  key: string;
  /** What to answer, in the member's words: "Add a profile photo". */
  label: string;
  section: string;
  /** The wizard step that asks it (`/onboarding/<role>?step=<step>`). */
  step: string;
  done: boolean;
}

export interface ProfileStrengthSection {
  key: string;
  title: string;
  answered: number;
  total: number;
}

export interface ProfileStrength {
  percent: number;
  answered: number;
  total: number;
  sections: ProfileStrengthSection[];
  /** The next few unanswered questions, most useful first. */
  next: ProfileQuestion[];
  questions: ProfileQuestion[];
}

export interface ProfileStrengthInput {
  role: string;
  persona?: MemberPersona | null;
  email?: string | null;
  /** The wizard's sections, as the draft holds them. */
  draft: Record<string, unknown>;
  /** Types of the documents on file (DocumentType values). */
  documentTypes?: readonly string[];
}

const SECTION_TITLE: Record<string, string> = {
  signup: "Sign-up",
  about: "About you",
  startup: "Your startup",
  depth: "Make it stand out",
  mentor: "Your mentoring",
  investor: "How you invest",
  organisation: "Your organisation",
};

type Section = Record<string, unknown>;

function has(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value;
  return true;
}

function section(draft: Record<string, unknown>, key: string): Section {
  const value = draft[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Section) : {};
}

function positive(value: unknown): boolean {
  return has(value) && Number(value) > 0;
}

type Q = Omit<ProfileQuestion, "done"> & { done: boolean };

function q(key: string, label: string, sectionKey: string, step: string, done: boolean): Q {
  return { key, label, section: sectionKey, step, done };
}

function signupQuestions(input: ProfileStrengthInput, personal: Section): Q[] {
  const step = "personal-details";
  return [
    q("fullName", "Your name", "signup", step, has(personal.fullName)),
    q("email", "Your email", "signup", step, has(input.email)),
    q("mobileNumber", "Your mobile number", "signup", step, has(personal.mobileNumber)),
    q("nationality", "Your nationality", "signup", step, has(personal.nationality)),
    q("persona", "Who you are on VittamHub", "signup", step, has(input.persona)),
  ];
}

function aboutQuestions(input: ProfileStrengthInput, personal: Section): Q[] {
  const step = "personal-details";
  const questions = [
    q("avatarUrl", "Add a profile photo", "about", step, has(personal.avatarUrl)),
    q("city", "Say where you're based", "about", step, has(personal.city)),
    q("linkedinUrl", "Add your LinkedIn", "about", step, has(personal.linkedinUrl)),
    q("bio", "Write a line about you", "about", step, has(personal.bio)),
  ];
  if (input.persona === MemberPersona.STUDENT) {
    questions.push(q("studentInstitution", "Name your college", "about", step, has(personal.studentInstitution)));
  }
  return questions;
}

function founderQuestions(input: ProfileStrengthInput): Q[] {
  const s = section(input.draft, "startupInfo");
  const product = section(input.draft, "product");
  const market = section(input.draft, "market");
  const traction = section(input.draft, "traction");
  const team = section(input.draft, "team");
  const funding = section(input.draft, "funding");
  const preferences = section(input.draft, "preferences");
  const verification = section(input.draft, "verification");
  const draftDocs = Array.isArray(verification.documents) ? (verification.documents as { type?: string }[]).map((doc) => doc.type) : [];
  const documents = new Set([...(input.documentTypes ?? []), ...draftDocs]);
  const registered = s.registrationStatus === "REGISTERED";

  const questions: Q[] = [
    q("startupName", "Name your startup or idea", "startup", "startup-info", has(s.name)),
    q("tagline", "Write a one-line pitch", "startup", "startup-info", has(s.tagline)),
    q("description", "Describe what you're building", "startup", "startup-info", has(s.description)),
    q("stage", "Say where you are today", "startup", "startup-info", has(s.productStatus) && has(s.revenueStatus) && has(s.fundingStatus)),
    q("industry", "Pick your industry", "startup", "startup-info", has(s.industry)),
    q("lookingFor", "Say what you're looking for", "startup", "preferences", has(preferences.lookingFor)),
    q("logoUrl", "Add a logo", "startup", "startup-info", has(s.logoUrl)),
    q("website", "Add your website", "startup", "startup-info", has(s.website)),
    q("foundedYear", "Add the year you started", "startup", "startup-info", has(s.foundedYear)),
    q(
      "registration",
      registered ? "Add your CIN or LLPIN" : "Say whether the company is registered",
      "startup",
      "startup-info",
      has(s.registrationStatus) && (!registered || has(s.registrationNumber)),
    ),
    q("problem", "Explain the problem you solve", "depth", "startup-info", has(s.problemStatement) || has(s.solution)),
    q("product", "Show the product: a demo, screenshots or a description", "depth", "product", has(product.demoVideoUrl) || has(product.screenshots) || has(product.description)),
    q("market", "Say who it's for and who else does it", "depth", "market", has(market.targetAudience) || has(market.primaryCustomer) || has(market.competitors)),
    q("traction", "Add your traction numbers", "depth", "traction", has(traction.monthlyRevenueAmount) || has(traction.totalUsers) || has(traction.totalCustomers)),
    q("team", "Add your team", "depth", "team", has(team.members)),
    q("funding", "Add your funding plan", "depth", "funding", positive(funding.fundingGoalAmount) || positive(funding.currentRaiseAmount) || has(funding.fundingTypes)),
    q("pitchDeck", "Upload your pitch deck", "depth", "verification", documents.has("PITCH_DECK")),
  ];
  if (registered) {
    questions.push(q("incorporation", "Upload your incorporation certificate", "depth", "verification", documents.has("INCORPORATION_CERTIFICATE")));
  }
  return questions;
}

function mentorQuestions(input: ProfileStrengthInput): Q[] {
  const m = section(input.draft, "mentorInfo");
  const step = "mentor-info";
  const feeDone = m.feeType === "FREE" || (m.feeType === "PAID" && positive(m.sessionFeeAmount));
  return [
    q("headline", "Write your headline", "mentor", step, has(m.headline)),
    q("mentorType", "Say what kind of mentor you are", "mentor", step, has(m.mentorType)),
    q("expertise", "Pick what you help with", "mentor", step, has(m.expertise)),
    q("stagesHelped", "Pick the stages you help at", "mentor", step, has(m.stagesHelped)),
    q("sessionTypes", "Pick the kinds of session you offer", "mentor", step, has(m.sessionTypes)),
    q("meetingMode", "Say how you meet founders", "mentor", step, has(m.meetingMode)),
    q("fee", "Set your fee, or say it's free", "mentor", step, feeDone),
    q("availability", "Say when founders can book you", "mentor", step, has(m.availability)),
    q("sessionLength", "Set how long a session is", "depth", step, has(m.sessionLengthMinutes)),
    q("industries", "Add the industries you know", "depth", step, has(m.industries)),
    q("yearsExperience", "Add your years of experience", "depth", step, has(m.yearsExperience)),
    q("languages", "Add the languages you mentor in", "depth", step, has(m.languages)),
    q("pastStartups", "Name startups you've helped", "depth", step, has(m.pastStartups)),
  ];
}

function investorQuestions(input: ProfileStrengthInput): Q[] {
  const i = section(input.draft, "investorInfo");
  const step = "investor-info";
  const firm = isOrganisationPersona(input.persona);
  const questions: Q[] = [];
  if (firm) {
    questions.push(
      q("investorType", "Say what kind of firm it is", "investor", step, has(i.investorType)),
      q("firm", "Add the firm's name and your role", "investor", step, has(i.firmName) && has(i.designation)),
    );
  }
  questions.push(
    q("sectors", "Pick the sectors you invest in", "investor", step, has(i.preferredIndustries)),
    q("stages", "Pick the stages you invest at", "investor", step, has(i.preferredStages)),
    q("cheque", "Set your cheque size", "investor", step, positive(i.checkSizeMaxAmount)),
    q("location", "Say where you're based", "investor", step, has(i.location)),
    q("about", "Tell founders about you", "depth", step, has(i.bio)),
    q("thesis", "Write your investment thesis", "depth", step, has(i.investmentThesis)),
    q("portfolio", "List companies you've backed", "depth", step, has(i.portfolioCompanies)),
    q("geography", "Add the regions you invest in", "depth", step, has(i.preferredGeography)),
    q("website", "Add a website", "depth", step, has(i.website)),
  );
  if (firm) questions.push(q("sebi", "Add your SEBI registration", "depth", step, has(i.sebiCategory)));
  return questions;
}

function incubatorQuestions(input: ProfileStrengthInput): Q[] {
  const o = section(input.draft, "incubatorInfo");
  const step = "incubator-info";
  const programs = Array.isArray(o.programs) ? o.programs : [];
  return [
    q("organizationName", "Name your organisation", "organisation", step, has(o.organizationName)),
    q("designation", "Add your role there", "organisation", step, has(o.designation)),
    q("hostType", "Say who runs it", "organisation", step, has(o.hostType)),
    q("orgCity", "Say where it is", "organisation", step, has(o.city)),
    q("industries", "Pick the sectors you back", "organisation", step, has(o.industries)),
    q("logoUrl", "Add your logo", "depth", step, has(o.logoUrl)),
    q("description", "Describe your programme", "depth", step, has(o.description)),
    q("website", "Add your website", "depth", step, has(o.website)),
    q("yearEstablished", "Add the year it started", "depth", step, has(o.yearEstablished)),
    q("incubatees", "Say how many startups you've incubated", "depth", step, has(o.currentIncubatees) || has(o.graduatedIncubatees)),
    q("programs", "Add a programme founders can apply to", "depth", step, programs.length > 0),
    q("portfolio", "List startups you've backed", "depth", step, has(o.portfolioCompanies)),
  ];
}

function universityQuestions(input: ProfileStrengthInput): Q[] {
  const u = section(input.draft, "universityInfo");
  const step = "university-info";
  return [
    q("institutionName", "Name your institution", "organisation", step, has(u.institutionName)),
    q("designation", "Add your role there", "organisation", step, has(u.designation)),
    q("institutionType", "Pick the type of institution", "organisation", step, has(u.affiliationType)),
    q("orgCity", "Say where it is", "organisation", step, has(u.city)),
    q("logoUrl", "Add your logo", "depth", step, has(u.logoUrl)),
    q("website", "Add your website", "depth", step, has(u.website)),
    q("incubationCell", "Name your E-cell or incubation cell", "depth", step, has(u.incubationCellName)),
    q("aisheCode", "Add your AISHE code", "depth", step, has(u.aisheCode)),
    q("departments", "List your departments", "depth", step, has(u.departments)),
    q("programmes", "List programmes for founders", "depth", step, has(u.programsOffered)),
  ];
}

function roleQuestions(input: ProfileStrengthInput): Q[] {
  switch (input.role) {
    case UserRole.FOUNDER:
      return founderQuestions(input);
    case UserRole.MENTOR:
      return mentorQuestions(input);
    case UserRole.INVESTOR:
      return investorQuestions(input);
    case UserRole.INCUBATOR:
      return incubatorQuestions(input);
    case UserRole.UNIVERSITY:
      return universityQuestions(input);
    default:
      return [];
  }
}

/** How complete a member's profile is, and what to answer next. */
export function profileStrength(input: ProfileStrengthInput, nextCount = 4): ProfileStrength {
  const personal = section(input.draft, "personalDetails");
  const signup = signupQuestions(input, personal);
  const rest = [...aboutQuestions(input, personal), ...roleQuestions(input)];
  const questions = [...signup, ...rest];

  const signupDone = signup.filter((item) => item.done).length;
  const restDone = rest.filter((item) => item.done).length;
  const share = rest.length > 0 ? SIGNUP_SHARE_PERCENT : 100;
  const percent = Math.round(share * (signupDone / signup.length) + (rest.length > 0 ? (100 - share) * (restDone / rest.length) : 0));

  const sectionKeys = [...new Set(questions.map((item) => item.section))];
  const sections = sectionKeys.map((key) => {
    const inSection = questions.filter((item) => item.section === key);
    return { key, title: SECTION_TITLE[key] ?? key, answered: inSection.filter((item) => item.done).length, total: inSection.length };
  });

  return {
    percent,
    answered: signupDone + restDone,
    total: questions.length,
    sections,
    next: questions.filter((item) => !item.done).slice(0, nextCount),
    questions,
  };
}
