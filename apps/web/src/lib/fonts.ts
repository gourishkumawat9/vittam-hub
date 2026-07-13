import { IBM_Plex_Sans, Inter, JetBrains_Mono, Manrope } from "next/font/google";

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-numeric",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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
 *   import localFont from "next/font/local";
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
