import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/marketing/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules for using VittamHub.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Who can use VittamHub",
    paragraphs: [
      "You must be at least 18 and able to enter a binding contract. If you act for a company, fund or institution, you confirm you are authorised to do so.",
    ],
  },
  {
    heading: "Your account",
    bullets: [
      "Give accurate information and keep it up to date.",
      "Keep your password private. You are responsible for activity on your account.",
      "One person, one account. Do not impersonate anyone or create profiles for organisations you do not represent.",
    ],
  },
  {
    heading: "Verification and Trust Score",
    paragraphs: [
      "Verification badges and Trust Scores reflect checks we were able to run at a point in time. They are signals, not guarantees, endorsements or investment advice. Always do your own due diligence before investing, partnering or sharing confidential information.",
    ],
  },
  {
    heading: "Not investment advice",
    paragraphs: [
      "VittamHub is a discovery and communication platform. We are not a stock exchange, broker, investment adviser or fundraising portal, and nothing on the platform is an offer to buy or sell securities. Any investment happens directly between the parties and is their responsibility.",
    ],
  },
  {
    heading: "Content you post",
    paragraphs: [
      "You keep ownership of what you upload and post. You give us a licence to host, display and process it only as needed to run the platform for you. You are responsible for having the right to share it.",
    ],
  },
  {
    heading: "Community rules",
    paragraphs: ["In communities, messages and anywhere else on VittamHub, do not:"],
    bullets: [
      "Post false, misleading or defamatory claims, or spam and unsolicited promotion.",
      "Harass, threaten or discriminate against anyone.",
      "Share someone else's confidential documents or personal data without permission.",
      "Scrape the platform, probe it for vulnerabilities without permission, or try to bypass connect-request limits.",
    ],
  },
  {
    heading: "Ending your use",
    paragraphs: [
      "You can delete your account at any time. We may suspend or remove accounts or content that break these terms, and we will tell you why unless the law prevents it.",
    ],
  },
  {
    heading: "Liability",
    paragraphs: [
      "VittamHub is provided as is during early access. To the extent the law allows, we are not liable for indirect losses, or for decisions you make based on information other users publish.",
    ],
  },
  {
    heading: "Governing law",
    paragraphs: ["These terms are governed by the laws of India."],
  },
  {
    heading: "Changes",
    paragraphs: ["We will tell you before material changes take effect. Continuing to use VittamHub after that means you accept the updated terms."],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="20 October 2026"
      intro="These terms are the agreement between you and VittamHub when you use the website and app. Please read them together with our privacy policy."
      sections={SECTIONS}
    />
  );
}
