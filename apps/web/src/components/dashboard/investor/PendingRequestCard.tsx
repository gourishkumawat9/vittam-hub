"use client";

import {
  useFollowStartup,
  useOpenConnectionAttachment,
  useRequestMoreInfo,
  useRespondToConnection,
  type ConnectionWithRelations,
} from "@vittamhub/api-client";
import { Avatar, Badge, Button, Card, useToast } from "@vittamhub/ui";
import { formatMoney } from "@vittamhub/utils";
import { Bookmark, Calendar, FileText, HelpCircle, PlayCircle } from "lucide-react";
import { useState } from "react";

import { ProposeMeetingDialog } from "@/components/connections/ProposeMeetingDialog";
import { openFetchedLink } from "@/lib/open-link";
import { externalHref } from "@/lib/safe-url";

const TEXT_ACTION =
  "flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-60";

/**
 * A founder's connect request waiting on the investor, with everything needed
 * to decide on the spot (CLAUDE.md §4): the introduction, the ask, the deck,
 * and accept, reject or ignore. Used on the investor home and the requests page.
 */
export function PendingRequestCard({ connection }: { connection: ConnectionWithRelations }) {
  const respond = useRespondToConnection();
  const followStartup = useFollowStartup();
  const requestMoreInfo = useRequestMoreInfo();
  const { toast } = useToast();
  const [actioning, setActioning] = useState<"ACCEPT" | "DECLINE" | "IGNORE" | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const openAttachment = useOpenConnectionAttachment();
  const waitingDays = Math.max(0, Math.floor((Date.now() - new Date(connection.createdAt).getTime()) / 86_400_000));

  // An uploaded deck sits in private storage, so its stored address opens nothing; a short-lived link is fetched on the click.
  const viewAttachment = (kind: "pitch-deck" | "executive-summary") =>
    openFetchedLink(async () => (await openAttachment.mutateAsync({ id: connection.id, kind })).url);

  const act = async (action: "ACCEPT" | "DECLINE" | "IGNORE") => {
    setActioning(action);
    try {
      await respond.mutateAsync({ id: connection.id, action });
      const founderName = connection.startup?.name ?? connection.requester.fullName;
      // Accepting is the moment the core loop unlocks (CLAUDE.md §4), so the
      // confirmation also says what became possible — a confirmation that
      // only says "done" makes the user go looking for what changed.
      if (action === "ACCEPT") {
        toast({
          variant: "success",
          title: `Connected with ${founderName}`,
          description: "You can now message each other, share documents, and schedule a meeting.",
        });
      } else {
        toast({
          variant: "info",
          title: action === "DECLINE" ? `Declined ${founderName}` : `Ignored ${founderName}`,
          description: action === "DECLINE" ? "They've been notified." : "It won't appear in your queue again.",
        });
      }
    } finally {
      setActioning(null);
    }
  };

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            size="md"
            src={connection.startup?.logoUrl ?? connection.requester.avatarUrl ?? undefined}
            name={connection.startup?.name ?? connection.requester.fullName}
          />
          <div className="min-w-0">
            <h3 className="title-3 truncate">{connection.startup?.name ?? connection.requester.fullName}</h3>
            <p className="caption-5 line-clamp-1">
              {connection.startup ? `${connection.requester.fullName} · ${connection.startup.tagline}` : "Founder"}
            </p>
          </div>
        </div>
        <Badge variant={waitingDays >= 3 ? "warning" : "neutral"} className="shrink-0 whitespace-nowrap">
          {waitingDays === 0 ? "New today" : `Waiting ${waitingDays} day${waitingDays === 1 ? "" : "s"}`}
        </Badge>
      </div>

      {connection.introduction && <p className="body-5 line-clamp-4 text-text-primary">{connection.introduction}</p>}

      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        {connection.fundingRequirementAmount != null && (
          <span className="font-medium text-text-primary">Raising {formatMoney(connection.fundingRequirementAmount, connection.currency)}</span>
        )}
        {connection.pitchDeckUrl && (
          <button type="button" onClick={() => void viewAttachment("pitch-deck")} className="flex items-center gap-1 font-medium text-brand-700 hover:underline dark:text-brand-300">
            <FileText className="h-3.5 w-3.5" aria-hidden /> Pitch deck
          </button>
        )}
        {connection.executiveSummaryUrl && (
          <button type="button" onClick={() => void viewAttachment("executive-summary")} className="flex items-center gap-1 font-medium text-brand-700 hover:underline dark:text-brand-300">
            <FileText className="h-3.5 w-3.5" aria-hidden /> One-pager
          </button>
        )}
        {connection.demoLinkUrl && (
          <a href={externalHref(connection.demoLinkUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-brand-700 hover:underline dark:text-brand-300">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden /> Demo
          </a>
        )}
      </div>

      {connection.infoRequestedAt && <p className="text-xs font-medium text-warning-700">You asked for more information on this request.</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {connection.startup && (
            <button
              type="button"
              onClick={() => followStartup.mutate({ startupId: connection.startup!.id, notifyOnUpdate: false })}
              disabled={followStartup.isPending || followStartup.isSuccess}
              className={TEXT_ACTION}
            >
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> {followStartup.isSuccess ? "Saved" : "Save"}
            </button>
          )}
          <button type="button" onClick={() => setMeetingOpen(true)} className={TEXT_ACTION}>
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Propose meeting
          </button>
          {!connection.infoRequestedAt && (
            <button type="button" onClick={() => requestMoreInfo.mutate(connection.id)} disabled={requestMoreInfo.isPending} className={TEXT_ACTION}>
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> Ask for more
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" isLoading={actioning === "IGNORE"} onClick={() => act("IGNORE")}>
            Ignore
          </Button>
          <Button size="sm" variant="secondary" isLoading={actioning === "DECLINE"} onClick={() => act("DECLINE")}>
            Decline
          </Button>
          <Button size="sm" isLoading={actioning === "ACCEPT"} onClick={() => act("ACCEPT")}>
            Accept
          </Button>
        </div>
      </div>

      <ProposeMeetingDialog connectionId={connection.id} withName={connection.requester.fullName} open={meetingOpen} onOpenChange={setMeetingOpen} />
    </Card>
  );
}

