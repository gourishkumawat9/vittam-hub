import { GraduationCap, Handshake, IdCard, Users } from "@vittamhub/ui/icons";
import type { IconComponent } from "@vittamhub/ui/icons";

import type { ProductShotImage } from "@/components/marketing/ProductShot";

import { PRODUCT_SHOTS } from "./product-shots";

export interface PlatformFeature {
  id: "profile" | "investors" | "mentorship" | "community";
  title: string;
  description: string;
  icon: IconComponent;
  /** What a member can actually do with it today, shown when its tab is open. */
  points: string[];
  link: { label: string; href: string };
  /** The real screen shown beside it on the home page. */
  image: ProductShotImage;
}

/**
 * What the platform does today, in the four areas it is focused on first
 * (the owner's call, November 2026): startups, investors, mentors and the
 * founder community. Paused or not yet live work (Startup Passport, the
 * timeline, incubator and university tools) is left out until it ships.
 */
export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: "profile",
    title: "Startup profile",
    description: "One page with what you do, your stage and what you need. Set up in about five minutes, add the rest later.",
    icon: IdCard,
    points: [
      "Four short steps to publish, with your deck and documents whenever you're ready",
      "Listed in discovery as soon as it's published",
      "A verified badge once the required details and documents are in",
    ],
    link: { label: "Create your startup profile", href: "/register?role=founder" },
    image: PRODUCT_SHOTS.startupProfile,
  },
  {
    id: "investors",
    title: "Investor connect",
    description: "Find investors by stage, industry and cheque size, then reach them with a connect request, not a cold email.",
    icon: Handshake,
    points: [
      "Investors ranked by how well their stage, industry and ticket size fit you",
      "A connect request carries your summary, your raise and, if you like, your deck",
      "Chat, documents and meetings open once the investor accepts",
    ],
    link: { label: "How it works for founders", href: "/for/founders" },
    image: PRODUCT_SHOTS.founderInvestors,
  },
  {
    id: "mentorship",
    title: "Mentorship",
    description: "Request a session with mentors who have built and scaled in your space, and keep every conversation in one place.",
    icon: GraduationCap,
    points: [
      "Search mentors by expertise and send a request with your question",
      "The mentor accepts, sets the time and shares a meeting link",
      "After the session, both sides mark it done and leave a short review",
    ],
    link: { label: "Mentoring on VittamHub", href: "/for/mentors" },
    image: PRODUCT_SHOTS.mentorSessions,
  },
  {
    id: "community",
    title: "Community",
    description: "Founder updates, questions and events in one focused feed.",
    icon: Users,
    points: [
      "Post startup updates, questions, polls and events",
      "Hear from founders a stage ahead of you, and from mentors",
      "Save the posts you want to come back to",
    ],
    link: { label: "Join the community", href: "/register" },
    image: PRODUCT_SHOTS.communityFeed,
  },
];
