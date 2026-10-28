"use client";

import { useEffect } from "react";

/**
 * Shown only when the root layout itself crashes, so nothing from it (fonts,
 * Tailwind globals, providers) can be relied on — hence inline styles.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#FFFFFF",
          color: "#0F172A",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image needs the layout that just crashed */}
        <img src="/brand/vittamhub-logo.png" alt="VittamHub" height={36} style={{ height: 36, width: "auto" }} />
        <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: 420, margin: 0, color: "#475569" }}>
          VittamHub hit an unexpected problem. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          style={{ padding: "12px 24px", borderRadius: 10, border: 0, background: "rgb(95 137 200)", color: "#FFFFFF", fontSize: 15, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
