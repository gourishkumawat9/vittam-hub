import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What VittamHub collects, who can see it, and how to delete it.",
};

// Every statement here describes what the code does (CLAUDE.md §2: nothing invented). Change the code, change this page.
const SECTIONS: LegalSection[] = [
  {
    title: "What we collect",
    body: (
      <ul>
        <li>Your account: your name, email address, the kind of account you chose, and your password, which is stored only as a one-way hash.</li>
        <li>
          What you add to your profile: the personal details the setup asks for (mobile number, date of birth, gender, nationality, city,
          state and country), your startup&apos;s or organisation&apos;s details, and the pictures you upload.
        </li>
        <li>Documents you upload, such as a pitch deck, a certificate of incorporation or an ID.</li>
        <li>Your sign-ins: the browser and IP address of each device you are signed in on, so you can review them and sign them out.</li>
        <li>What you do on the platform: connect requests, messages, meetings, posts, comments and follows.</li>
      </ul>
    ),
  },
  {
    title: "Who can see what",
    body: (
      <ul>
        <li>Your public profile can be seen by anyone, unless you make it private, investors-only or stealth in your settings.</li>
        <li>Your personal details (mobile number, date of birth, gender, nationality) are never shown on your profile.</li>
        <li>
          A startup&apos;s revenue is shown to the public as a range. Burn rate, runway, the amount being raised, valuation and use of funds
          are shown only to investor accounts. A founder can hide the numbers altogether.
        </li>
        <li>
          Documents are private. Only you can open them, plus anyone you choose to share one with. A share ends on its own after 14 days,
          and every view uses a link that stops working after a few minutes.
        </li>
        <li>Messages and meetings open only after an investor accepts a connect request, and only the two of you can see them.</li>
      </ul>
    ),
  },
  {
    title: "Cookies",
    body: (
      <>
        <p>VittamHub sets three cookies, all needed for the site to work:</p>
        <ul>
          <li>one that keeps you signed in,</li>
          <li>one that renews that sign-in without asking for your password again,</li>
          <li>one that protects your account from requests made by other websites.</li>
        </ul>
        <p>Your light or dark theme choice is saved in your browser. There are no advertising or tracking cookies.</p>
      </>
    ),
  },
  {
    title: "Visit counts",
    body: (
      <>
        <p>
          We count visits with Vercel Web Analytics, which sets no cookies. For each page you open it records the page&apos;s address, the
          site that linked you here, your country, and your browser, operating system and kind of device. It isn&apos;t linked to your
          VittamHub account.
        </p>
        <p>
          Before a visit is sent, everything after a &ldquo;?&rdquo; or &ldquo;#&rdquo; in the address is removed, apart from campaign tags
          (&ldquo;utm_&rdquo;), so links that carry a password-reset or sign-in code never reach it.
        </p>
      </>
    ),
  },
  {
    title: "What we don't do",
    body: <p>We don&apos;t sell your data, and we don&apos;t show advertising.</p>,
  },
  {
    title: "Your choices",
    body: (
      <ul>
        <li>Change anything on your profile at any time from &ldquo;Edit profile&rdquo;.</li>
        <li>See every device you are signed in on, and sign any of them out, under Settings.</li>
        <li>
          Delete your account under Settings. That removes your account, your profile and startup, your posts, your documents and the
          pictures you uploaded, and signs you out everywhere. Your email address can then be used for a new account.
        </li>
      </ul>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Your data, in plain words"
      intro="What VittamHub collects, who can see it, and how to remove it."
      updated="November 2026"
      sections={SECTIONS}
    />
  );
}
