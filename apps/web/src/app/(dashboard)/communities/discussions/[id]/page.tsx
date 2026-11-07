"use client";

import {
  useCurrentUser,
  useDiscussion,
  useMarkSolution,
  useRemoveDiscussion,
  useRemoveDiscussionReply,
  useReplyToDiscussion,
  type DiscussionReplyItem,
} from "@vittamhub/api-client";
import { COMMUNITY_DOMAINS, industryToCommunitySlug } from "@vittamhub/types";
import { Badge, Button, Card, EmptyState, ErrorState, Textarea } from "@vittamhub/ui";
import { ArrowLeft, CheckCircle2, MessagesSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { AuthorLine } from "@/components/communities/AuthorLine";
import { VoteControl } from "@/components/communities/VoteControl";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { cn } from "@/lib/utils";

function ReplyCard({
  reply,
  discussionId,
  currentUserId,
  isAsker,
  isQuestion,
  isAdmin,
}: {
  reply: DiscussionReplyItem;
  discussionId: string;
  currentUserId?: string;
  isAsker: boolean;
  isQuestion: boolean;
  isAdmin: boolean;
}) {
  const markSolution = useMarkSolution(discussionId);
  const removeReply = useRemoveDiscussionReply();
  const canDelete = reply.authorId === currentUserId || isAdmin;

  return (
    <Card className={cn("flex gap-3 p-4 sm:gap-4", reply.isSolution && "border-success-600 ring-1 ring-success-600")}>
      <VoteControl target="reply" id={reply.id} score={reply.score} myVote={reply.myVote} isOwn={reply.authorId === currentUserId} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {reply.isSolution && (
          <Badge variant="success" className="w-fit">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Accepted solution
          </Badge>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">{reply.body}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AuthorLine author={reply.author} createdAt={reply.createdAt} />
          <div className="flex items-center gap-1">
            {isAsker && isQuestion && (
              <Button
                size="sm"
                variant={reply.isSolution ? "ghost" : "outline"}
                isLoading={markSolution.isPending}
                onClick={() => markSolution.mutate(reply.isSolution ? null : reply.id)}
              >
                {reply.isSolution ? "Unmark solution" : "Mark as solution"}
              </Button>
            )}
            {canDelete && (
              <Button size="icon" variant="ghost" aria-label="Delete reply" isLoading={removeReply.isPending} onClick={() => removeReply.mutate(reply.id)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DiscussionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const discussion = useDiscussion(id);
  const reply = useReplyToDiscussion(id);
  const removeDiscussion = useRemoveDiscussion();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();

  if (discussion.isLoading) return <ListRowsSkeleton count={5} />;
  if (discussion.isError || !discussion.data) {
    return (
      <ErrorState
        title="This thread isn't available"
        description="It may have been deleted."
        action={
          <Link href="/communities" className="text-sm font-medium text-brand-primary hover:underline">
            Back to communities
          </Link>
        }
      />
    );
  }

  const d = discussion.data;
  const community = COMMUNITY_DOMAINS[d.industry];
  const communityHref = `/communities/${industryToCommunitySlug(d.industry)}`;
  const isAsker = d.authorId === user?.id;
  const isAdmin = user?.role === "ADMIN";

  const submitReply = async () => {
    if (!body.trim()) {
      setError("Write a reply first");
      return;
    }
    setError(undefined);
    await reply.mutateAsync({ body });
    setBody("");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href={communityHref} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {community.name}
      </Link>

      <article className="flex gap-3 sm:gap-4">
        <VoteControl target="discussion" id={d.id} score={d.score} myVote={d.myVote} isOwn={isAsker} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {d.kind === "QUESTION" ? (
              d.isSolved ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Solved
                </Badge>
              ) : (
                <Badge variant="warning">Needs an answer</Badge>
              )
            ) : (
              <Badge variant="neutral">Discussion</Badge>
            )}
          </div>
          <h1 className="font-heading text-2xl font-semibold leading-tight text-text-primary">{d.title}</h1>
          <AuthorLine author={d.author} createdAt={d.createdAt} prefix="Asked by" />
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-text-primary">{d.body}</p>
          {(isAsker || isAdmin) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-danger-600"
              isLoading={removeDiscussion.isPending}
              onClick={async () => {
                if (!window.confirm("Delete this thread and all its replies?")) return;
                await removeDiscussion.mutateAsync(d.id);
                router.push(communityHref);
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete thread
            </Button>
          )}
        </div>
      </article>

      <section aria-labelledby="replies-heading" className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 id="replies-heading" className="font-heading text-lg font-semibold text-text-primary">
          {d.replies.length} {d.replies.length === 1 ? "reply" : "replies"}
        </h2>
        {isAsker && d.kind === "QUESTION" && !d.isSolved && d.replies.length > 0 && (
          <p className="text-sm text-text-secondary">Did one of these solve it? Mark it as the solution so others find it fast.</p>
        )}

        {d.replies.length > 0 ? (
          d.replies.map((r) => (
            <ReplyCard
              key={r.id}
              reply={r}
              discussionId={d.id}
              currentUserId={user?.id}
              isAsker={isAsker}
              isQuestion={d.kind === "QUESTION"}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <EmptyState icon={MessagesSquare} title="No replies yet" description="Know the answer, or faced the same problem? Share what worked." />
        )}

        <Card className="flex flex-col gap-3 p-4">
          <Textarea
            label="Your reply"
            rows={4}
            value={body}
            error={error}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share what worked for you, with specifics."
          />
          <Button className="w-fit self-end" onClick={submitReply} isLoading={reply.isPending}>
            Post reply
          </Button>
        </Card>
      </section>
    </div>
  );
}
