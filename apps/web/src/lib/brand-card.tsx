import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { SITE_TAGLINE, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_SIZE } from "@/lib/seo";

export const BRAND_CARD_SIZE = SOCIAL_IMAGE_SIZE;
export const BRAND_CARD_ALT = SOCIAL_IMAGE_ALT;

/** The official logo file's native size (public/brand/vittamhub-logo.png). */
const LOGO_WIDTH = 836;
const LOGO_HEIGHT = 172;
const LOGO_SCALE = 0.9;

/**
 * The social preview card (Open Graph + X/Twitter): the official logo
 * (CLAUDE.md §1, composited from the real file, never redrawn) above the
 * tagline, on white so the light-blue logo keeps its contrast.
 *
 * Rendered once at build time (the routes using it are `force-static`), so
 * reading from `public/` via the build's working directory is safe and the
 * card is served from the CDN instead of a function on every share.
 */
export async function renderBrandCard() {
  const logo = await readFile(join(process.cwd(), "public/brand/vittamhub-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

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
          background: "#FFFFFF",
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(95,137,200,0.16), transparent 50%), radial-gradient(circle at 85% 90%, rgba(126,167,216,0.14), transparent 50%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image */}
        <img src={logoSrc} width={LOGO_WIDTH * LOGO_SCALE} height={LOGO_HEIGHT * LOGO_SCALE} alt="VittamHub" />
        <div style={{ display: "flex", marginTop: 56, fontSize: 44, fontWeight: 600, color: "#0F172A" }}>{SITE_TAGLINE}</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 28, color: "#475569" }}>
          The digital identity platform for startups, from idea to unicorn
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 40, fontSize: 24, color: "#5F89C8" }}>vittamhub.com</div>
      </div>
    ),
    { ...BRAND_CARD_SIZE },
  );
}
