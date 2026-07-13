"use client";

import Script from "next/script";
import { useId, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => void;
    };
  }
}

/** Renders nothing when `siteKey` is null (CAPTCHA_SITE_KEY unset server-side) — auth flows work fully without it, see docs/09-authentication-security.md. */
export function Turnstile({ siteKey, onVerify }: { siteKey: string | null; onVerify: (token: string) => void }) {
  const containerId = useId().replace(/:/g, "");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onLoad={() => {
          setScriptLoaded(true);
          window.turnstile?.render(`#${containerId}`, { sitekey: siteKey, callback: onVerify });
        }}
      />
      <div id={containerId} aria-hidden={!scriptLoaded} />
    </>
  );
}
