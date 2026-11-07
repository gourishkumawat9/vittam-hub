import { ImageResponse } from "next/og";

import { SITE_TAGLINE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** Native size of public/brand/vittamhub-logo.png; kept so the logo is scaled, never stretched. */
const LOGO_WIDTH = 836;
const LOGO_HEIGHT = 172;
const LOGO_RENDER_WIDTH = 760;

/**
 * The social preview card shared by opengraph-image and twitter-image. It
 * shows the official logo file as-is (CLAUDE.md §1) on a light background,
 * where its colors were designed to sit, with the tagline set as plain text.
 */
export async function renderOgCard() {
  const logo = await fetch(new URL("../../public/brand/vittamhub-logo.png", import.meta.url)).then((res) =>
    res.arrayBuffer(),
  );

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
            "radial-gradient(circle at 15% 20%, rgba(95,137,200,0.16), transparent 50%), radial-gradient(circle at 85% 85%, rgba(126,167,216,0.14), transparent 50%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, next/image isn't available here */}
        <img
          // Satori accepts the raw bytes; the DOM typings only know strings.
          src={logo as unknown as string}
          alt=""
          width={LOGO_RENDER_WIDTH}
          height={Math.round((LOGO_RENDER_WIDTH * LOGO_HEIGHT) / LOGO_WIDTH)}
        />
        <div style={{ display: "flex", fontSize: 40, color: "#334155", marginTop: 48 }}>{SITE_TAGLINE}</div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
