"use client";

import { Card, CardHeader, CardTitle } from "@vittamhub/ui";
import { Handshake, Pencil, Plus, Rocket, UserCircle } from "lucide-react";
import Link from "next/link";

interface QuickActionsCardProps {
  startupSlug?: string;
  /** Opens the dashboard's "Add milestone" dialog (one dialog, shared by every card that offers it). */
  onAddMilestone: () => void;
}

const TILE =
  "flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-center text-xs font-medium text-text-primary transition-colors hover:border-brand-200 hover:bg-brand-50";

export function QuickActionsCard({ startupSlug, onAddMilestone }: QuickActionsCardProps) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-brand-primary" /> Quick Actions
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onAddMilestone} className={TILE}>
          <Plus className="h-4 w-4 text-brand-primary" aria-hidden="true" /> Add milestone
        </button>
        <a href="#discover-investors" className={TILE}>
          <Handshake className="h-4 w-4 text-brand-primary" aria-hidden="true" /> Find investors
        </a>
        <Link href="/onboarding/founder" className={TILE}>
          <Pencil className="h-4 w-4 text-brand-primary" aria-hidden="true" /> Edit profile
        </Link>
        {startupSlug && (
          <Link href={`/startups/${startupSlug}`} className={TILE}>
            <UserCircle className="h-4 w-4 text-brand-primary" aria-hidden="true" /> View public page
          </Link>
        )}
      </div>
    </Card>
  );
}
