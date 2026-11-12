import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const BRAND_50 = "#F4F8FC";
const BRAND_700 = "#4D71A8";
const TEXT = "#111827";

/**
 * The social preview card shared by opengraph-image.tsx and twitter-image.tsx
 * (Next.js needs both files, each with its own static config exports). It
 * draws the official logo file itself, never a redrawn mark (CLAUDE.md §1),
 * on the light blue wash the site's heroes use, so it stays in step with the brand.
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
          background: BRAND_50,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(95,137,200,0.28), transparent 62%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image */}
        <img src={logoSrc} alt="VittamHub" width={logoWidth} height={Math.round((logoWidth * 172) / 836)} />
        <div style={{ display: "flex", fontSize: 34, color: TEXT, marginTop: 40, letterSpacing: -0.5 }}>
          Visibility for Tomorrow&apos;s Unicorns
        </div>
        <div style={{ display: "flex", fontSize: 24, color: BRAND_700, marginTop: 14 }}>
          Founders, investors, mentors, incubators and universities in one place
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
