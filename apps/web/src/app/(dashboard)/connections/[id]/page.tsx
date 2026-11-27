"use client";

import {
  useConnectionMeetings,
  useConnectionMessages,
  useConnections,
  useCurrentUser,
  useOpenConnectionAttachment,
  useSendMessage,
  type ConnectionWithRelations,
} from "@vittamhub/api-client";
import { Avatar, Button, Card, EmptyState, Skeleton, useToast } from "@vittamhub/ui";
import { formatMoney } from "@vittamhub/utils";
import { ArrowLeft, CalendarPlus, FileText, Lock, MessageCircle, PlayCircle, Send, Video } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";
import { ProposeMeetingDialog } from "@/components/connections/ProposeMeetingDialog";
import { PanelTitle } from "@/components/dashboard/PageHeader";
import { openFetchedLink } from "@/lib/open-link";
import { externalHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

type ThreadMessage = NonNullable<ReturnType<typeof useConnectionMessages>["data"]>[number];

/** Messages from one person, sent within a few minutes of each other, read as one block. */
const GROUP_GAP_MS = 5 * 60 * 1000;

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Splits the thread into days, and each day into runs of messages from the same person. */
function groupMessages(messages: ThreadMessage[]) {
  const days: { label: string; groups: { senderId: string; messages: ThreadMessage[] }[] }[] = [];
  for (const message of messages) {
    const label = dayLabel(new Date(message.createdAt));
    let day = days[days.length - 1];
    if (!day || day.label !== label) {
      day = { label, groups: [] };
      days.push(day);
    }
    const group = day.groups[day.groups.length - 1];
    const last = group?.messages[group.messages.length - 1];
    if (group && last && group.senderId === message.senderId && Date.parse(message.createdAt) - Date.parse(last.createdAt) < GROUP_GAP_MS) {
      group.messages.push(message);
    } else {
      day.groups.push({ senderId: message.senderId, messages: [message] });
    }
  }
  return days;
}

/** Meetings on this connection: the next ones with a link to join, and how many have already happened. */
function MeetingsCard({ connectionId, onPropose }: { connectionId: string; onPropose: () => void }) {
  const { data: meetings, isLoading } = useConnectionMeetings(connectionId);
  const now = Date.now();
  const upcoming = (meetings ?? []).filter((m) => Date.parse(m.scheduledAt) >= now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const pastCount = (meetings ?? []).length - upcoming.length;

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={Video} title="Meetings" />
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : upcoming.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {upcoming.map((meeting) => {
            const when = new Date(meeting.scheduledAt);
            const joinHref = externalHref(meeting.videoCallUrl);
            return (
              <li key={meeting.id} className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-button bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  <span className="text-[10px] font-semibold uppercase leading-none">{when.toLocaleDateString(undefined, { month: "short" })}</span>
                  <span className="font-numeric text-lg font-bold leading-tight">{when.getDate()}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="body-5 text-text-primary">
                    {when.toLocaleDateString(undefined, { weekday: "long" })}, {timeLabel(meeting.scheduledAt)}
                  </p>
                  {meeting.notes && <p className="caption-5 line-clamp-2">{meeting.notes}</p>}
                  {joinHref && (
                    <a href={joinHref} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                      <Video className="h-3.5 w-3.5" aria-hidden="true" /> Join call
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="caption-5">No meeting booked. Propose a time and it shows here for both of you, each in your own time zone.</p>
      )}
      {pastCount > 0 && <p className="caption-5">{pastCount === 1 ? "1 earlier meeting" : `${pastCount} earlier meetings`}</p>}
      <Button variant="secondary" size="sm" className="w-full" onClick={onPropose}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Propose a time
      </Button>
    </Card>
  );
}

/** What the founder sent with the request: the introduction, the ask, and the deck, one-pager and demo. */
function RequestCard({ connection }: { connection: ConnectionWithRelations }) {
  const openAttachment = useOpenConnectionAttachment();
  const { toast } = useToast();
  const demoHref = externalHref(connection.demoLinkUrl);

  const view = async (kind: "pitch-deck" | "executive-summary") => {
    const opened = await openFetchedLink(async () => (await openAttachment.mutateAsync({ id: connection.id, kind })).url);
    if (!opened) toast({ title: "Couldn't open that file", description: "Try again in a moment.", variant: "error" });
  };

  const files = [
    connection.pitchDeckUrl && { label: "Pitch deck", icon: FileText, onClick: () => view("pitch-deck") },
    connection.executiveSummaryUrl && { label: "One-pager", icon: FileText, onClick: () => view("executive-summary") },
  ].filter(Boolean) as { label: string; icon: typeof FileText; onClick: () => void }[];

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={MessageCircle} title="The connect request" />
      {connection.startup && (
        <Link href={`/startups/${connection.startup.slug}`} className="group flex items-center gap-3 rounded-button border border-border p-3 transition-colors hover:border-brand-300">
          <Avatar name={connection.startup.name} src={connection.startup.logoUrl} size="md" className="rounded-button" />
          <span className="flex min-w-0 flex-col">
            <span className="body-5 truncate text-text-primary group-hover:text-brand-primary">{connection.startup.name}</span>
            <span className="caption-5 line-clamp-2">{connection.startup.tagline}</span>
          </span>
        </Link>
      )}
      {connection.introduction && <p className="body-6 whitespace-pre-line text-text-secondary">{connection.introduction}</p>}
      <dl className="grid grid-cols-2 gap-3 rounded-button bg-background-secondary p-3">
        <div className="flex flex-col gap-0.5">
          <dt className="caption-5">Raising</dt>
          <dd className="body-5 text-text-primary">
            {connection.fundingRequirementAmount != null
              ? formatMoney(connection.fundingRequirementAmount, connection.currency)
              : "Not stated"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="caption-5">Sent</dt>
          <dd className="body-5 text-text-primary">{new Date(connection.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</dd>
        </div>
      </dl>
      {(files.length > 0 || demoHref) && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <Button key={file.label} size="sm" variant="secondary" onClick={file.onClick} disabled={openAttachment.isPending}>
              <file.icon className="h-4 w-4" aria-hidden="true" /> {file.label}
            </Button>
          ))}
          {demoHref && (
            <Button size="sm" variant="secondary" asChild>
              <a href={demoHref} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="h-4 w-4" aria-hidden="true" /> Demo
              </a>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * The conversation a founder and an investor get once a connect request is
 * accepted (CLAUDE.md §4): messages on the left, and beside them the meeting
 * times and what the founder sent with the request.
 */
export default function ConnectionThreadPage() {
  const params = useParams<{ id: string }>();
  const connectionId = params.id;

  const { data: user } = useCurrentUser();
  const { data: connectionsResult, isLoading: connectionsLoading } = useConnections({ page: 1, pageSize: 100 });
  const connection = connectionsResult?.items.find((c) => c.id === connectionId);

  const { data: messages, isLoading } = useConnectionMessages(connectionId);
  const sendMessage = useSendMessage(connectionId);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => groupMessages(messages ?? []), [messages]);
  const messageCount = messages?.length ?? 0;

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messageCount]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sendMessage.isPending) return;
    setSendError(null);
    try {
      await sendMessage.mutateAsync({ body });
      setDraft("");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Couldn't send that message.");
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const backHref = user?.role === "INVESTOR" ? "/investor/messages" : "/founder/investors";
  const backLabel = user?.role === "INVESTOR" ? "Messages" : "Investors";
  const back = (
    <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
    </Link>
  );

  if (connectionsLoading || !user) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-[32rem] w-full lg:col-span-8" />
          <Skeleton className="h-72 w-full lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <EmptyState icon={MessageCircle} title="Conversation not found" description="It may belong to another account, or the link is incomplete." />
      </div>
    );
  }

  const otherParty = connection.requesterId === user.id ? connection.recipient : connection.requester;

  if (connection.status !== "ACCEPTED") {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Card className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 py-10 text-center">
          <Avatar name={otherParty.fullName} src={otherParty.avatarUrl} size="lg" />
          <div className="flex flex-col items-center gap-2">
            <p className="title-2">{otherParty.fullName}</p>
            <ConnectionStatusBadge status={connection.status} />
          </div>
          <p className="caption-2 max-w-sm">
            {connection.status === "PENDING"
              ? "Messages, documents and meetings open once the investor accepts the connect request."
              : "This connect request wasn't accepted, so there's no conversation."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {back}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-label={`Conversation with ${otherParty.fullName}`}
          className="flex h-[calc(100dvh-11rem)] min-h-[30rem] flex-col overflow-hidden rounded-card border border-border bg-surface lg:col-span-8"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={otherParty.fullName} src={otherParty.avatarUrl} size="md" />
              <div className="min-w-0">
                <h1 className="title-2 truncate">{otherParty.fullName}</h1>
                <p className="caption-5 truncate">
                  {connection.startup ? `${connection.startup.name} · ` : ""}
                  Connected {new Date(connection.respondedAt ?? connection.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" className="shrink-0 lg:hidden" onClick={() => setMeetingOpen(true)}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Propose a time</span>
              <span className="sr-only sm:hidden">Propose a time</span>
            </Button>
          </header>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="ml-auto h-10 w-1/2" />
              </div>
            ) : days.length === 0 ? (
              <div className="m-auto flex max-w-sm flex-col items-center gap-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="body-5 text-text-primary">Start the conversation</p>
                <p className="caption-5">Say hello, ask what you want to know before a call, or propose a time to talk.</p>
              </div>
            ) : (
              days.map((day) => (
                <div key={day.label} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3" role="separator" aria-label={day.label}>
                    <span className="h-px flex-1 bg-border" />
                    <span className="caption-5 font-semibold">{day.label}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  {day.groups.map((group) => {
                    const mine = group.senderId === user.id;
                    const last = group.messages[group.messages.length - 1]!;
                    return (
                      <div key={group.messages[0]!.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                        {!mine && <Avatar name={otherParty.fullName} src={otherParty.avatarUrl} size="sm" />}
                        <div className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
                          {group.messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                mine ? "rounded-br-md bg-brand-primary text-white" : "rounded-bl-md bg-background-secondary text-text-primary",
                              )}
                            >
                              {message.body}
                            </div>
                          ))}
                          <span className="caption-5 px-1">{timeLabel(last.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex flex-col gap-1.5 border-t border-border p-3 sm:p-4"
          >
            <div className="flex items-end gap-2">
              <label htmlFor="message" className="sr-only">
                Message {otherParty.fullName}
              </label>
              <textarea
                id="message"
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Write a message…"
                className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-button border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary [field-sizing:content] focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              <Button type="submit" isLoading={sendMessage.isPending} disabled={!draft.trim()} aria-label="Send message">
                <Send className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
            {sendError ? (
              <p className="caption-5 text-danger-600">{sendError}</p>
            ) : (
              <p className="hidden items-center gap-1.5 caption-5 sm:flex">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Only you and {otherParty.fullName} see this conversation. Enter to send, Shift + Enter for a new line.
              </p>
            )}
          </form>
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4">
          <MeetingsCard connectionId={connection.id} onPropose={() => setMeetingOpen(true)} />
          <RequestCard connection={connection} />
        </aside>
      </div>

      <ProposeMeetingDialog connectionId={connection.id} withName={otherParty.fullName} open={meetingOpen} onOpenChange={setMeetingOpen} />
    </div>
  );
}
