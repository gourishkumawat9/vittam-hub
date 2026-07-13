import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VittamHub — Visibility for Tomorrow's Unicorns";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND_PRIMARY = "#5F89C8";
const SLATE_900 = "#0F172A";

/**
 * Generated at request time (edge runtime) via Satori, not a static asset —
 * keeps the social preview in lockstep with the brand tokens instead of a
 * hand-exported PNG that silently drifts out of date.
 */
export default function OpengraphImage() {
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
          background: SLATE_900,
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(95,137,200,0.35), transparent 55%), radial-gradient(circle at 75% 75%, rgba(126,167,216,0.25), transparent 55%)`,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" style={{ marginBottom: 32 }}>
          <path d="M17 8H43V14L35 20V72L43 78V84H17V78L25 72V20L17 14Z" fill="#FFFFFF" />
          <path d="M57 8H83V14L75 20V72L83 78V84H57V78L65 72V20L57 14Z" fill="#FFFFFF" />
          <rect x="10" y="44" width="80" height="6" fill="#FFFFFF" />
          <path d="M35 47L50 68L65 47" stroke="#FFFFFF" strokeWidth="6" />
        </svg>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#FFFFFF", letterSpacing: -1 }}>
          VittamHub
        </div>
        <div style={{ display: "flex", fontSize: 30, color: BRAND_PRIMARY, marginTop: 16 }}>
          Visibility for Tomorrow&apos;s Unicorns
        </div>
      </div>
    ),
    { ...size },
  );
}
