import localFont from "next/font/local";

/**
 * Self-hosted, not `next/font/google`. With `next/font/google`, every build
 * downloads the fonts from Google, and on 7 Nov 2026 Google Fonts answered
 * GitHub's CI runners with a response Next.js 14 can't parse ("An error
 * occurred in next/font"), failing builds on main and on every PR. Shipping
 * the files in the repo removes that network step from the build.
 *
 * Each file is the family's official variable font (OFL, licences in
 * src/fonts/licenses), cut down to the weights below and to Google's
 * "latin" character set plus ₹ and arrows. That's the same subset the site
 * loaded from Google before, at about the same size. Rebuild them with
 * src/fonts/tools/make_fonts.py (see src/fonts/README.md).
 */

export const manrope = localFont({
  src: "../fonts/Manrope-latin.woff2",
  weight: "500 700",
  variable: "--font-heading",
  display: "swap",
});

export const inter = localFont({
  src: "../fonts/Inter-latin.woff2",
  weight: "400 600",
  variable: "--font-body",
  display: "swap",
});

export const ibmPlexSans = localFont({
  src: "../fonts/IBMPlexSans-latin.woff2",
  weight: "500 700",
  variable: "--font-numeric",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../fonts/JetBrainsMono-latin.woff2",
  weight: "400 500",
  variable: "--font-mono",
  display: "swap",
});

/**
 * Henderson Sans (logo/wordmark only) is a licensed typeface, not on Google
 * Fonts, and `next/font/local` resolves its file paths at *build* time — so
 * wiring it up before the licensed .woff2 files exist breaks every build.
 * The `fontFamily.brand` token in @vittamhub/tokens already falls back to
 * Manrope for that reason.
 *
 * Once `public/fonts/HendersonSans-Regular.woff2` and `-Bold.woff2` are
 * added (see public/fonts/README.md), uncomment:
 *
 *   export const hendersonSans = localFont({
 *     src: [
 *       { path: "../../public/fonts/HendersonSans-Regular.woff2", weight: "400", style: "normal" },
 *       { path: "../../public/fonts/HendersonSans-Bold.woff2", weight: "700", style: "normal" },
 *     ],
 *     variable: "--font-brand",
 *     display: "swap",
 *     fallback: ["Manrope", "sans-serif"],
 *   });
 *
 * ...and add `hendersonSans.variable` alongside `fontVariables` in layout.tsx.
 */

export const fontVariables = [manrope.variable, inter.variable, ibmPlexSans.variable, jetbrainsMono.variable].join(" ");
