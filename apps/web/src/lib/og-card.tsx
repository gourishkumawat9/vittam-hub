import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const NAVY = "#0B1B38"; // brand-950
const LOGO_BLUE = "#8BAFE4"; // brand-300, next to the logo's own #7DB2E3

/**
 * The social preview card shared by opengraph-image.tsx and twitter-image.tsx
 * (Next.js needs both files, each with its own static config exports). It
 * draws the official logo file itself, never a redrawn mark (CLAUDE.md §1),
 * on the navy used across the site, so it stays in step with the brand.
 */
export async function renderOgCard() {
  const logoSvg = await fetch(new URL("../../public/brand/vittamhub-logo.svg", import.meta.url)).then((response) => response.text());
  const logoSrc = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
  const logoWidth = 640;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: NAVY,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(46,111,209,0.45), transparent 60%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image */}
        <img src={logoSrc} alt="VittamHub" width={logoWidth} height={Math.round((logoWidth * 172) / 836)} />
        <div style={{ display: "flex", fontSize: 34, color: "#FFFFFF", marginTop: 40, letterSpacing: -0.5 }}>
          Visibility for Tomorrow&apos;s Unicorns
        </div>
        <div style={{ display: "flex", fontSize: 24, color: LOGO_BLUE, marginTop: 14 }}>
          Founders, investors, mentors, incubators and universities in one place
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
