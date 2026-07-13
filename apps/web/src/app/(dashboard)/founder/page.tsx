"use client";

import { useConnectionQuota, useConnections, useInvestors, type InvestorWithOwner } from "@vittamhub/api-client";
import { Badge, Button, Card, EmptyState } from "@vittamhub/ui";
import { formatCompactUsd, formatRelativeTime } from "@vittamhub/utils";
import { Handshake, Inbox, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";
import { SendConnectRequestDialog } from "@/components/connections/SendConnectRequestDialog";

function InvestorCard({ investor, onConnect }: { investor: InvestorWithOwner; onConnect: (investor: InvestorWithOwner) => void }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{investor.owner.fullName}</h3>
          <p className="text-xs text-text-secondary">{investor.firmName ?? "Independent investor"}</p>
        </div>
        <Badge variant={investor.openForPitches ? "success" : "neutral"}>
          {investor.openForPitches ? "Open for pitches" : "Not reviewing"}
        </Badge>
      </div>

      <p className="text-sm text-text-secondary">{investor.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {investor.preferredIndustries.slice(0, 4).map((industry) => (
          <Badge key={industry} variant="brand">
            {industry}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-text-secondary">
        <span>
          {formatCompactUsd(Number(investor.checkSizeMinUsd))} – {formatCompactUsd(Number(investor.checkSizeMaxUsd))}
        </span>
        <Button size="sm" onClick={() => onConnect(investor)} disabled={!investor.openForPitches}>
          Connect
        </Button>
      </div>
    </Card>
  );
}

export default function FounderDashboardPage() {
  const { data: investors, isLoading: investorsLoading } = useInvestors();
  const { data: connections, isLoading: connectionsLoading } = useConnections();
  const { data: quota } = useConnectionQuota();
  const [connectingTo, setConnectingTo] = useState<InvestorWithOwner | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Founder dashboard</h1>
        {quota && (
          <Badge variant={quota.remaining === 0 ? "danger" : "neutral"}>
            {quota.limit === null
              ? "Unlimited connect requests"
              : `${quota.remaining} of ${quota.limit} connect requests left this month`}
          </Badge>
        )}
      </div>

      {quota?.remaining === 0 && (
        <Card className="flex items-center justify-between gap-4 border-warning-200 bg-warning-50">
          <p className="text-sm text-text-primary">
            You&apos;ve used all your connect requests for this month on the {quota.plan} plan.
          </p>
          <Button size="sm" variant="secondary" disabled>
            Upgrade (coming soon)
          </Button>
        </Card>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Discover investors</h2>
        {investorsLoading ? (
          <p className="text-sm text-text-secondary">Loading investors…</p>
        ) : investors && investors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investors.map((investor) => (
              <InvestorCard key={investor.id} investor={investor} onConnect={setConnectingTo} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Handshake} title="No investors listed yet" description="Check back soon as investors join VittamHub." />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Your connect requests</h2>
        {connectionsLoading ? (
          <p className="text-sm text-text-secondary">Loading…</p>
        ) : connections && connections.length > 0 ? (
          <div className="flex flex-col divide-y divide-border rounded-card border border-border">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{connection.recipient.fullName}</p>
                  <p className="text-xs text-text-secondary">Sent {formatRelativeTime(connection.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ConnectionStatusBadge status={connection.status} />
                  {connection.status === "ACCEPTED" && (
                    <Link
                      href={`/connections/${connection.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Message
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No connect requests yet" description="Send your first request to an investor above." />
        )}
      </section>

      {connectingTo && (
        <SendConnectRequestDialog investor={connectingTo} open={!!connectingTo} onOpenChange={(open) => !open && setConnectingTo(null)} />
      )}
    </div>
  );
}
