"use client";

import { useDiscussionVote } from "@vittamhub/api-client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Vote = -1 | 0 | 1;

/**
 * Reddit-style up/down control. Renders the vote optimistically so a tap
 * responds instantly; the list refetches when the server confirms, and a
 * failure rolls the local state back (the global toast explains why).
 * Your own posts show the score but can't be voted on.
 */
export function VoteControl({
  target,
  id,
  score,
  myVote,
  isOwn,
  orientation = "vertical",
}: {
  target: "discussion" | "reply";
  id: string;
  score: number;
  myVote: Vote;
  isOwn: boolean;
  orientation?: "vertical" | "horizontal";
}) {
  const vote = useDiscussionVote();
  const [local, setLocal] = useState<{ vote: Vote; score: number }>({ vote: myVote, score });

  useEffect(() => setLocal({ vote: myVote, score }), [myVote, score]);

  const cast = (direction: 1 | -1) => {
    const next: Vote = local.vote === direction ? 0 : direction;
    const previous = local;
    setLocal({ vote: next, score: local.score + (next - local.vote) });
    vote.mutate({ target, id, value: next }, { onError: () => setLocal(previous) });
  };

  const buttonClass = (active: boolean, tone: "up" | "down") =>
    cn(
      "flex h-9 w-9 items-center justify-center rounded-button transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
      "disabled:cursor-not-allowed disabled:opacity-40",
      active
        ? tone === "up"
          ? "bg-brand-100 text-brand-700"
          : "bg-danger-50 text-danger-600"
        : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
    );

  const ownHint = isOwn ? "You can't vote on your own post" : undefined;

  return (
    <div className={cn("flex items-center", orientation === "vertical" ? "flex-col gap-0.5" : "gap-1")}>
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={local.vote === 1}
        title={ownHint}
        disabled={isOwn}
        onClick={() => cast(1)}
        className={buttonClass(local.vote === 1, "up")}
      >
        <ChevronUp className="h-5 w-5" aria-hidden="true" />
      </button>
      <span
        className={cn(
          "min-w-[2ch] text-center text-sm font-semibold tabular-nums",
          local.vote === 1 ? "text-brand-700" : local.vote === -1 ? "text-danger-600" : "text-text-primary",
        )}
        aria-label={`Score ${local.score}`}
      >
        {local.score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={local.vote === -1}
        title={ownHint}
        disabled={isOwn}
        onClick={() => cast(-1)}
        className={buttonClass(local.vote === -1, "down")}
      >
        <ChevronDown className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
