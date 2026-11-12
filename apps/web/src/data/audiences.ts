import {
  Award,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  Compass,
  GraduationCap,
  Handshake,
  IdCard,
  Inbox,
  Kanban,
  MessageCircle,
  MessageSquare,
  Network,
  Rocket,
  School,
  Send,
  Target,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AudienceId = "founders" | "investors" | "mentors" | "incubators" | "universities";

export interface AudienceCapability {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Audience {
  id: AudienceId;
  /** Short name for the nav, cards and footer. */
  label: string;
  /** "a founder", "an investor": for sentences like "Ready to join as …?" */
  singular: string;
  eyebrow: string;
  icon: LucideIcon;
  /** The home page card. */
  cardTitle: string;
  cardBlurb: string;
  /** The /for/[audience] page. */
  heroTitle: string;
  heroIntro: string;
  metaDescription: string;
  /** Lowercase role for /register?role=… (matched case-insensitively there). */
  registerRole: string;
  ctaLabel: string;
  capabilities: AudienceCapability[];
  steps: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
}

/**
 * The five stakeholder groups live today (CLAUDE.md "Current scope"; the sixth
 * area, community, is a section on the home page). Every line describes a
 * feature that exists in the product now. No numbers, users or results are
 * claimed (CLAUDE.md §2), and verification is always automated (§6).
 */
export const AUDIENCES: Audience[] = [
  {
    id: "founders",
    label: "Founders",
    singular: "a founder",
    eyebrow: "For founders",
    icon: Rocket,
    cardTitle: "Build a profile investors can trust",
    cardBlurb: "Tell your startup's story once, show your progress, and reach investors through structured connect requests.",
    heroTitle: "Build the profile your startup deserves.",
    heroIntro:
      "One profile for your whole journey, from idea to unicorn. Show your progress, find mentors and programmes, and reach the right investors with a structured connect request instead of a cold email.",
    metaDescription:
      "Build a verified startup profile, track your Trust Score, find mentors and incubators, and reach investors through structured connect requests.",
    registerRole: "founder",
    ctaLabel: "Create your founder profile",
    capabilities: [
      {
        icon: IdCard,
        title: "One startup profile",
        description: "A guided setup captures your stage, industry, team, traction and documents in one profile you keep up to date.",
      },
      {
        icon: Award,
        title: "Trust Score",
        description: "A transparent score with a full breakdown and next steps. It rises with verification and evidence, never with claims alone.",
      },
      {
        icon: Send,
        title: "Connect requests",
        description: "Reach an investor with a short introduction, your funding requirement and, if you like, a pitch deck, summary or demo link.",
      },
      {
        icon: GraduationCap,
        title: "Mentor sessions",
        description: "Ask a mentor who knows your space for a session. Mentor requests have no monthly limit.",
      },
      {
        icon: Building2,
        title: "Incubators and universities",
        description: "Browse incubation and acceleration programmes with their eligibility and application windows, and university startup cells.",
      },
      {
        icon: BarChart3,
        title: "Milestones and analytics",
        description: "Add milestones, see who viewed your profile, and post updates for the community.",
      },
    ],
    steps: [
      { title: "Create your account", description: "Choose Founder and sign up with your email. It's free." },
      { title: "Build your profile", description: "The guided setup walks you through your stage, team, traction and documents." },
      {
        title: "Get verified automatically",
        description: "Your verification status and Trust Score update on their own as you add details. There's no review queue to wait in.",
      },
      { title: "Reach investors", description: "Send connect requests. When an investor accepts, chat and meetings open up." },
    ],
    faq: [
      {
        question: "Is VittamHub free for founders?",
        answer:
          "Yes. The Free plan includes your profile, discovery search, your Trust Score and a monthly allowance of investor connect requests. Paid plans haven't launched, and every account will hear about them before anything changes.",
      },
      {
        question: "Why can't I message an investor directly?",
        answer:
          "So investors can trust their inbox. Every first contact is a connect request with your introduction and funding requirement. Once the investor accepts, you can chat and schedule meetings.",
      },
      {
        question: "What stage does my startup need to be at?",
        answer: "Any stage. VittamHub covers the whole journey, from Idea and Validation to Funded, Scaling and beyond, and investors filter by the stages they back.",
      },
      {
        question: "How does verification work?",
        answer:
          "It's worked out automatically from what you add, such as your documents, your work email and your profile details. Nobody approves or rejects profiles by hand.",
      },
    ],
  },
  {
    id: "investors",
    label: "Investors",
    singular: "an investor",
    eyebrow: "For investors",
    icon: Handshake,
    cardTitle: "Discover startups at every stage",
    cardBlurb: "Filter startup profiles by your thesis and review structured requests instead of cold pitches.",
    heroTitle: "Find your next investment, with the facts up front.",
    heroIntro:
      "Browse startup profiles from Idea to Scaling, filter by your thesis, and receive structured connect requests you can accept, decline or ignore. No founder can message you until you accept.",
    metaDescription:
      "Discover startups by stage and industry, receive structured connect requests, and manage your watchlist, pipeline and meetings in one place.",
    registerRole: "investor",
    ctaLabel: "Create your investor profile",
    capabilities: [
      {
        icon: Compass,
        title: "Startup discovery",
        description: "Search and filter startup profiles by stage, industry and more, and save searches to come back to.",
      },
      {
        icon: Inbox,
        title: "Structured requests",
        description: "Each request arrives with an introduction, the funding requirement and any deck, summary or demo link. Accept, decline, ignore or ask for more.",
      },
      {
        icon: Bell,
        title: "Watchlist and alerts",
        description: "Save startups, keep a watchlist and get an alert when something you follow changes.",
      },
      {
        icon: Kanban,
        title: "Pipeline and portfolio",
        description: "Move deals through your investment pipeline and keep your portfolio in the same place.",
      },
      {
        icon: Target,
        title: "Mandates and recommendations",
        description: "Set your investment mandates and see the startups that match them.",
      },
      {
        icon: MessageCircle,
        title: "Messages and meetings",
        description: "Once you accept a request, message the founder and schedule meetings without leaving VittamHub.",
      },
    ],
    steps: [
      { title: "Create your account", description: "Choose Investor and sign up with your email. It's free." },
      { title: "Set your thesis", description: "Add the stages, industries, geographies and cheque sizes you invest in." },
      { title: "Discover and save", description: "Filter startups, save the ones you like and set alerts for the ones you're watching." },
      { title: "Respond to requests", description: "Accept the founders you want to talk to. Chat and meetings open only after you accept." },
    ],
    faq: [
      {
        question: "Is VittamHub free for investors?",
        answer: "Yes. Everything that's live today is free. Paid plans haven't launched, and every account will hear about them before anything changes.",
      },
      {
        question: "Can founders flood my inbox?",
        answer:
          "No. Founders can only reach you through connect requests, and each founder has a monthly allowance of them. Nobody can message you before you accept.",
      },
      {
        question: "What if I need more detail before deciding?",
        answer: "Ask the founder for more information. They're told what you asked for, and the request stays open until you accept, decline or ignore it.",
      },
      {
        question: "How are investors verified?",
        answer:
          "Automatically, from the details and documents you add. Founders see your verification status, which helps protect them from fake investors.",
      },
    ],
  },
  {
    id: "mentors",
    label: "Mentors",
    singular: "a mentor",
    eyebrow: "For mentors",
    icon: GraduationCap,
    cardTitle: "Share what you've learned",
    cardBlurb: "List your expertise, choose the sessions you offer, and accept the founder requests that fit.",
    heroTitle: "Help founders skip the mistakes you've already made.",
    heroIntro:
      "Create a mentor profile with your expertise, industries and the sessions you offer. Founders send you session requests saying what they want to discuss, and you choose which ones to accept.",
    metaDescription: "Create a mentor profile, choose the sessions you offer, and accept session requests from founders.",
    registerRole: "mentor",
    ctaLabel: "Create your mentor profile",
    capabilities: [
      {
        icon: UserCircle,
        title: "Mentor profile",
        description: "Your headline, expertise, industries, experience and languages, listed in the mentor directory founders browse.",
      },
      {
        icon: CalendarClock,
        title: "Session requests",
        description: "Founders tell you what they want to discuss and which times suit them. Accept or decline each request.",
      },
      {
        icon: ClipboardList,
        title: "Your session types",
        description: "Offer the formats that suit you: one-on-one sessions, group sessions, workshops or advisory roles.",
      },
      {
        icon: MessageSquare,
        title: "Community",
        description: "Share what you know, answer founders' questions and run polls and events in the community feed.",
      },
    ],
    steps: [
      { title: "Create your account", description: "Choose Mentor and sign up with your email. It's free." },
      { title: "Build your profile", description: "Add your expertise, industries, languages and the session types you offer." },
      { title: "Get found", description: "Founders find you in the mentor directory and send session requests." },
      { title: "Choose your sessions", description: "Accept the requests that fit your time and expertise, and decline the rest." },
    ],
    faq: [
      {
        question: "Who can send me a session request?",
        answer: "Founders on VittamHub. Each request says what they'd like to discuss and when suits them.",
      },
      {
        question: "Can I turn a request down?",
        answer: "Yes. You accept or decline every request yourself, and a founder can ask again later.",
      },
      {
        question: "Is it free to be a mentor?",
        answer: "Yes. Creating a mentor profile and receiving requests is free.",
      },
    ],
  },
  {
    id: "incubators",
    label: "Incubators",
    singular: "an incubator",
    eyebrow: "For incubators and accelerators",
    icon: Building2,
    cardTitle: "Fill your next cohort",
    cardBlurb: "List your programmes, eligibility and application windows where founders are already looking.",
    heroTitle: "Put your programmes in front of the right founders.",
    heroIntro:
      "Create a profile for your incubator or accelerator, list each programme with its eligibility, duration and application window, and send founders straight to your application form.",
    metaDescription: "List your incubation and acceleration programmes, eligibility and application windows where founders look for support.",
    registerRole: "incubator",
    ctaLabel: "Create your programme profile",
    capabilities: [
      {
        icon: Building2,
        title: "Organisation profile",
        description: "Your focus industries, portfolio companies and mentor network, with a verification status worked out automatically.",
      },
      {
        icon: ClipboardList,
        title: "Programmes",
        description: "List each programme with a description, duration, eligibility, application dates and a link to apply.",
      },
      {
        icon: Compass,
        title: "Directory listing",
        description: "Appear in the incubator directory founders browse when they look for support at their stage.",
      },
      {
        icon: Network,
        title: "Mentors and universities",
        description: "Browse mentors and university startup cells to grow your network.",
      },
      {
        icon: MessageSquare,
        title: "Community",
        description: "Announce intakes, demo days and events in the community feed.",
      },
    ],
    steps: [
      { title: "Create your account", description: "Choose Incubator / Accelerator and sign up with your email. It's free." },
      { title: "Build your profile", description: "Add your focus industries, portfolio and mentor network." },
      { title: "Add your programmes", description: "Eligibility, duration, application dates and your application link." },
      { title: "Get found", description: "Founders find your programmes in the directory and apply through your link." },
    ],
    faq: [
      {
        question: "Do founders apply through VittamHub?",
        answer: "Not yet. Each programme links to your own application form, so you keep your current process.",
      },
      {
        question: "Can accelerators join too?",
        answer: "Yes. Choose incubator or accelerator when you set up your profile.",
      },
      {
        question: "Is it free?",
        answer: "Yes. Creating a profile and listing programmes is free.",
      },
    ],
  },
  {
    id: "universities",
    label: "Universities",
    singular: "a university",
    eyebrow: "For universities",
    icon: School,
    cardTitle: "Open doors for student founders",
    cardBlurb: "Showcase your startup cell and programmes, and connect your campus to the wider ecosystem.",
    heroTitle: "Give your student founders a bigger stage.",
    heroIntro:
      "Create a profile for your institution and its startup or incubation cell, show the departments and programmes you offer, and help student founders find mentors, incubators and investors.",
    metaDescription: "Showcase your university's startup cell, departments and programmes, and connect student founders to the ecosystem.",
    registerRole: "university",
    ctaLabel: "Create your institution profile",
    capabilities: [
      {
        icon: School,
        title: "Institution profile",
        description: "Your institution, affiliation, incubation cell, departments and programmes in one profile.",
      },
      {
        icon: Compass,
        title: "Directory listing",
        description: "Appear in the university directory founders browse.",
      },
      {
        icon: Network,
        title: "Mentors and incubators",
        description: "Browse mentors and incubation programmes to partner with.",
      },
      {
        icon: MessageSquare,
        title: "Community",
        description: "Share events, competitions and announcements with the founder community.",
      },
    ],
    steps: [
      { title: "Create your account", description: "Choose University / Institution and sign up with your email. It's free." },
      { title: "Build your profile", description: "Add your startup cell, departments and the programmes you offer." },
      { title: "Get listed", description: "Founders and incubators find you in the university directory." },
      { title: "Bring your founders", description: "Student founders sign up as founders and build their own startup profiles." },
    ],
    faq: [
      {
        question: "Can our students join?",
        answer: "Yes. Student founders sign up as founders and build their own startup profile.",
      },
      {
        question: "Is it free?",
        answer: "Yes. Creating an institution profile is free.",
      },
    ],
  },
];

export function findAudience(id: string): Audience | undefined {
  return AUDIENCES.find((audience) => audience.id === id);
}
