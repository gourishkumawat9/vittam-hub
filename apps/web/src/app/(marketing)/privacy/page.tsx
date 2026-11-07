import type { Metadata } from "next";

import { LEGAL_CONTACT_EMAIL, LegalPage, type LegalSection } from "@/components/marketing/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What VittamHub collects, why, who it is shared with, and the rights you have over your data.",
};

// Describes what the platform actually does today (see HANDOFF.md §B, §G, §H),
// written for India's Digital Personal Data Protection Act, 2023.
const SECTIONS: LegalSection[] = [
  {
    heading: "What we collect",
    bullets: [
      "Account details: your name, email address, role, and a password (stored only as a one-way hash). If you sign in with Google, GitHub or LinkedIn we receive your name, email and profile picture from that provider.",
      "Profile details you choose to add: startup, investor, mentor or organisation information, team members, metrics, funding history and anything else you enter during onboarding.",
      "Documents you upload to your data room, and a log of who viewed them and when.",
      "Verification data: work-email and phone one-time codes, and the results of checks we run to verify claims on your profile.",
      "Activity on the platform: connect requests, messages, meetings, community posts, replies and votes.",
      "Technical data: IP address, browser type and security logs, used to keep accounts safe and to rate-limit abuse.",
    ],
  },
  {
    heading: "Why we use it",
    bullets: [
      "To run your account and show your profile to the people you choose.",
      "To verify claims and calculate your Trust Score. A score only rises through verification, never from text you type.",
      "To deliver connect requests, messages, notifications and account emails.",
      "To protect the platform: preventing fraud, spam and unauthorised access.",
    ],
    paragraphs: ["We do not sell your personal data, and we do not use it for third-party advertising."],
  },
  {
    heading: "Who can see your information",
    paragraphs: [
      "Public profile fields are visible to anyone. Private and stealth profiles are hidden from search. Documents in your data room are visible only to people you grant access to, and every grant can expire or be revoked. Messages are visible only to the people in the conversation.",
    ],
  },
  {
    heading: "Service providers we rely on",
    paragraphs: ["We share data only with the providers needed to run VittamHub, under contracts that limit how they use it:"],
    bullets: [
      "Hosting and database: Vercel, Railway and Neon (PostgreSQL).",
      "File storage: Cloudflare R2.",
      "Email delivery: Resend.",
      "Payments, once paid plans launch: Stripe. We never see or store your card number.",
      "Bot protection on sign-up and login: Cloudflare Turnstile.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "We use only the cookies needed to keep you signed in and to protect forms against cross-site request forgery. They are httpOnly where possible and are not used for advertising or tracking across other sites.",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "We keep your data while your account is active. When you delete your account we delete or anonymise your personal data, except where we must keep records to meet a legal obligation or resolve a dispute.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      `You can ask to access, correct or erase your personal data, withdraw consent, or nominate someone to act for you. Email ${LEGAL_CONTACT_EMAIL} and we will respond within 30 days. If you are not satisfied with our response, you may complain to the Data Protection Board of India.`,
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "Passwords are hashed with Argon2, sessions use secure httpOnly cookies, two-factor login is available, and documents are served through short-lived signed links. No system is perfectly secure; if we learn of a breach affecting you, we will tell you and the authorities as the law requires.",
    ],
  },
  {
    heading: "Children",
    paragraphs: ["VittamHub is for people aged 18 and over. We do not knowingly collect data from children."],
  },
  {
    heading: "Changes to this policy",
    paragraphs: ["If we make material changes we will update this page and tell you by email or in the app before they take effect."],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="20 October 2026"
      intro="VittamHub is built on trust, and that starts with being clear about your data. This policy explains what we collect, why, who it is shared with, and the choices you have."
      sections={SECTIONS}
    />
  );
}
