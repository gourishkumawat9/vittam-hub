"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { currentPreviewRole, isPreviewMode, PREVIEW_ROLES, type PreviewRole } from "@/lib/preview/mode";
import { asRole, PREVIEW_AREAS } from "@/lib/preview/pages";

const LABEL: Record<PreviewRole, string> = {
  founder: "Founder",
  investor: "Investor",
  admin: "Admin",
  mentor: "Mentor",
  incubator: "Incubator",
  university: "University",
};

/**
 * A small floating bar in dashboard preview mode (lib/preview/mode.ts): says
 * the page is demo data and lets the viewer jump to another demo account.
 * Renders nothing anywhere else.
 */
export function PreviewBanner() {
  const pathname = usePathname();
  const [role, setRole] = useState<PreviewRole | null>(null);

  useEffect(() => {
    if (isPreviewMode()) setRole(currentPreviewRole());
  }, [pathname]);

  if (!role || pathname === "/preview") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-overlay flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-full border border-brand-200 bg-surface/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur">
        <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">Preview · demo data, nothing is saved</span>
        <label className="flex items-center gap-1 text-text-secondary">
          Viewing as
          <select
            className="rounded-button border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-text-primary"
            value={role}
            onChange={(event) => {
              const next = event.target.value as PreviewRole;
              const home = PREVIEW_AREAS.find((a) => a.role === next)?.pages[0]?.href ?? "/community";
              window.location.assign(asRole(home, next));
            }}
          >
            {PREVIEW_ROLES.map((r) => (
              <option key={r} value={r}>
                {LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <a href="/preview" className="font-medium text-brand-700 hover:underline">
          All dashboards
        </a>
      </div>
    </div>
  );
}
