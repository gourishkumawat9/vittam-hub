import { CalendarDays, Megaphone, Vote } from "lucide-react";
import Link from "next/link";

import type { CommunityPost } from "@/data/community";
import { COMMUNITY_POSTS } from "@/data/community";

import { cta } from "./cta";

const KIND_ICON = { "Startup update": Megaphone, Poll: Vote, Event: CalendarDays } as const;

function ExamplePost({ post }: { post: CommunityPost }) {
  const Icon = KIND_ICON[post.kind];
  return (
    <article className="rounded-card border border-border bg-surface p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-xs font-bold text-brand-700">
            {post.initials}
          </span>
          <div>
            <p className="text-sm font-semibold text-text-primary">{post.author}</p>
            <p className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {post.kind}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-text-secondary">Example</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-text-primary">{post.content}</p>
      {post.pollOptions && (
        <ul className="mt-4 flex flex-col gap-2" aria-label="Poll options">
          {post.pollOptions.map((option) => (
            <li key={option} className="rounded-sm border border-border px-3 py-2 text-sm text-text-primary">
              {option}
            </li>
          ))}
        </ul>
      )}
      {post.eventDetail && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-sm bg-background-secondary px-3 py-2 text-sm font-medium text-text-primary">
          <CalendarDays className="h-4 w-4 text-brand-primary" aria-hidden="true" />
          {post.eventDetail}
        </p>
      )}
    </article>
  );
}

/**
 * The sixth live area. A split block like BCG's feature panels: what the
 * community is on the left, one example of each post type on the right.
 */
export function CommunitySection() {
  return (
    <section id="community" className="scroll-mt-16 bg-background">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-24">
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">Community</span>
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]/[1.12]">
            A community built around real progress
          </h2>
          <p className="text-lg leading-relaxed text-text-secondary">
            Founders share updates and milestones, mentors share what they know, and incubators and universities announce programmes
            and events. Post, comment, run polls and RSVP to events in one focused feed.
          </p>
          <Link href="/register" className={cta.primary}>
            Join the community
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {COMMUNITY_POSTS.map((post) => (
            <ExamplePost key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
