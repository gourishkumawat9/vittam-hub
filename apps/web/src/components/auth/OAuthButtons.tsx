"use client";

import { getApiBaseUrl, waitForApi } from "@vittamhub/api-client";
import { Github, Linkedin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { StatusScreen } from "@/components/StatusScreen";
import { WakingProgress } from "@/components/WakingProgress";
import { CinematicLoader } from "@/components/loader/CinematicLoader";

const PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "linkedin", label: "Continue with LinkedIn", icon: Linkedin },
  { id: "github", label: "Continue with GitHub", icon: Github },
] as const;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * OAuth is a full-page redirect to the API (/v1/auth/{provider}), not a fetch
 * call. Going there blind meant a sleeping API showed a blank tab for a
 * minute, and a down API showed the host's raw error page. So the button
 * first waits for the API's health check behind a VittamHub loading screen,
 * then redirects — or goes to /unavailable if the API never answers.
 */
export function OAuthButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [connecting, setConnecting] = useState<string | null>(null);

  const startOAuth = async (event: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    // Let modified clicks (new tab etc.) behave like the plain link they are.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    // currentTarget is gone once the handler awaits, so read the URL now.
    const oauthUrl = event.currentTarget.href;
    setConnecting(label.replace("Continue with ", ""));
    if (await waitForApi()) {
      window.location.href = oauthUrl;
    } else {
      router.push(`/unavailable?from=${encodeURIComponent(pathname)}`);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map((provider) => (
        <a
          key={provider.id}
          href={`${getApiBaseUrl()}/v1/auth/${provider.id}`}
          onClick={(event) => void startOAuth(event, provider.label)}
          className="inline-flex items-center justify-center gap-2.5 rounded-button border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-background-secondary"
        >
          <provider.icon className="h-4 w-4" />
          {provider.label}
        </a>
      ))}
      {connecting && (
        <div
          className="fixed inset-0 z-modal"
          role="alertdialog"
          aria-modal="true"
          aria-label={`Connecting to ${connecting}`}
        >
          <StatusScreen
            title={`Connecting to ${connecting}`}
            description="Getting VittamHub ready to sign you in."
            illustration={<CinematicLoader />}
          >
            <WakingProgress />
          </StatusScreen>
        </div>
      )}
    </div>
  );
}
