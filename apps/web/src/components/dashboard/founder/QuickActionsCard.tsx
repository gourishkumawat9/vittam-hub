"use client";

import { Card, CardHeader, CardTitle } from "@vittamhub/ui";
import { Handshake, Plus, Rocket, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AddMilestoneDialog } from "./AddMilestoneDialog";

interface QuickActionsCardProps {
  startupSlug?: string;
}

export function QuickActionsCard({ startupSlug }: QuickActionsCardProps) {
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-brand-primary" /> Quick Actions
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMilestoneDialogOpen(true)}
          className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary transition-colors hover:bg-background-secondary"
        >
          <Plus className="h-4 w-4 text-brand-primary" /> Add milestone
        </button>
        <a
          href="#discover-investors"
          className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary transition-colors hover:bg-background-secondary"
        >
          <Handshake className="h-4 w-4 text-brand-primary" /> Find investors
        </a>
        {startupSlug && (
          <Link
            href={`/startups/${startupSlug}`}
            className="flex flex-col items-center gap-1.5 rounded-card border border-border p-3 text-xs font-medium text-text-primary transition-colors hover:bg-background-secondary"
          >
            <UserCircle className="h-4 w-4 text-brand-primary" /> View profile
          </Link>
        )}
      </div>

      <AddMilestoneDialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen} />
    </Card>
  );
}
