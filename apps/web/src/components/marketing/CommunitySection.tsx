"use client";

import { Badge } from "@vittamhub/ui";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

import { COMMUNITY_POSTS } from "@/data/community";

import { SectionHeading } from "./SectionHeading";

export function CommunitySection() {
  return (
    <section id="community" className="mx-auto max-w-content px-6 py-24">
      <SectionHeading
        eyebrow="Community"
        title="What a founder update looks like"
        description="Illustrative example posts — VittamHub is in early access, so this isn't a live feed yet."
        action={<Badge variant="neutral">Example posts</Badge>}
      />
      <div className="mt-4 flex justify-center lg:justify-start">
        <Link href="/register" className="text-sm font-semibold text-brand-primary hover:underline">
          Join the community →
        </Link>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {COMMUNITY_POSTS.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="flex flex-col rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-heading text-xs font-bold text-brand-700">
                {post.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{post.authorName}</p>
                <p className="text-xs text-text-secondary">
                  {post.authorRole} · {post.timeAgo}
                </p>
              </div>
            </div>

            <p className="mt-4 flex-1 text-sm text-text-primary">{post.content}</p>

            <div className="mt-5 flex items-center gap-5 border-t border-border pt-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {post.comments}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
