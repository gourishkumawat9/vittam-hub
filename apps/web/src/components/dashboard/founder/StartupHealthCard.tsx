"use client";

import type { StartupProfile } from "@vittamhub/api-client";
import { Badge, Card, CardHeader, CardTitle } from "@vittamhub/ui";
import { Activity } from "lucide-react";
import Link from "next/link";

const STAGE_LABEL: Record<string, string> = {
  IDEA: "Idea",
  VALIDATION: "Validation",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  CUSTOMERS: "Early customers",
  REVENUE: "Revenue",
  FUNDED: "Funded",
  SCALING: "Scaling",
  UNICORN: "Unicorn",
};

const VERIFICATION_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  UNVERIFIED: "neutral",
};

export function StartupHealthCard({ startup }: { startup: StartupProfile }) {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-brand-primary" /> Startup Health
        </CardTitle>
        <Link href={`/startups/${startup.slug}`} className="text-xs font-medium text-brand-primary hover:underline">
          View public profile
        </Link>
      </CardHeader>

      <div>
        <p className="font-heading text-lg font-semibold text-text-primary">{startup.name}</p>
        <p className="text-sm text-text-secondary">{startup.tagline}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="brand">{STAGE_LABEL[startup.stage] ?? startup.stage}</Badge>
        <Badge variant={VERIFICATION_VARIANT[startup.verificationStatus] ?? "neutral"}>
          {startup.verificationStatus === "VERIFIED" ? "Verified" : "Verification " + startup.verificationStatus.toLowerCase()}
        </Badge>
        {startup.isFundraising && <Badge variant="success">Fundraising</Badge>}
      </div>
    </Card>
  );
}
