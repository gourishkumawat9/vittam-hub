import type { ProductShotImage } from "@/components/marketing/ProductShot";

/**
 * Screens of the real product, captured on the local demo accounts (every
 * name on them says "Demo", CLAUDE.md §2) and saved as WebP in
 * public/images/product/. Retake them when a screen changes noticeably:
 * capture at 1280×800 and 1.5× scale, then save at 1440 wide.
 */
const shot = (file: string, path: string, alt: string, height = 900): ProductShotImage => ({
  src: `/images/product/${file}.webp`,
  path,
  alt,
  width: 1440,
  height,
});

export const PRODUCT_SHOTS = {
  founders: shot("founder-dashboard", "/founder", "The founder dashboard on a demo account: next actions, Trust Score and profile completion"),
  investors: shot(
    "investor-discover",
    "/investor/discover",
    "Discover Startups on a demo investor account: industry filters and demo startup cards with a Connect button",
  ),
  mentors: shot("mentor-profile", "/mentors/…", "A demo mentor's profile as founders see it, with expertise tags and a Request a session button", 630),
  incubators: shot("incubator-profile", "/incubators/…", "A demo incubator's profile with its pre-incubation programme", 630),
  universities: shot("university-profile", "/universities/…", "A demo university startup cell's profile with the programmes it offers", 630),
  /** The public startup profile, captured at phone size (390 wide, 2× scale). */
  startupProfile: {
    src: "/images/product/startup-profile-phone.webp",
    path: "/startups/demo-startup",
    alt: "A demo startup's public profile on a phone: stage, verification and fundraising badges, and its overview",
    width: 780,
    height: 1120,
    device: "phone",
  },
} satisfies Record<string, ProductShotImage>;

/** The audience pages' screens, keyed by audience id. */
export type ProductShotKey = "founders" | "investors" | "mentors" | "incubators" | "universities";
