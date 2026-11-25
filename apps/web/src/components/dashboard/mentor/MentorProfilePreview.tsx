import type { MentorWithReputation } from "@vittamhub/api-client";
import { Avatar, Badge, Card } from "@vittamhub/ui";
import { Eye, Star } from "lucide-react";

import { VerifiedBadge } from "@/components/VerifiedBadge";

import { PanelLink, PanelTitle } from "../PageHeader";

import { SESSION_TYPE_LABEL } from "./labels";

/** The mentor's card as founders see it in the directory, with the two links to change it. */
export function MentorProfilePreview({ mentor }: { mentor: MentorWithReputation }) {
  const rating = mentor.reputation.averageRating;
  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={Eye} title="How founders see you" />
      <div className="flex flex-col gap-4 rounded-button border border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar name={mentor.owner.fullName} src={mentor.owner.avatarUrl} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="title-3 truncate">{mentor.owner.fullName}</p>
              <VerifiedBadge status={mentor.verificationStatus} />
            </div>
            <p className="caption-5 line-clamp-2">{mentor.headline ?? "Add a one line headline"}</p>
          </div>
        </div>
        <p className="flex items-center gap-1.5 caption-5">
          <Star className="h-3.5 w-3.5 text-warning-500" aria-hidden="true" />
          {rating != null ? (
            <>
              <span className="font-semibold text-text-primary">{rating.toFixed(1)}</span> from {mentor.reputation.reviewCount} review
              {mentor.reputation.reviewCount === 1 ? "" : "s"}
            </>
          ) : (
            "No reviews yet"
          )}
        </p>
        {mentor.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentor.expertise.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="brand">
                {skill}
              </Badge>
            ))}
          </div>
        )}
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="caption-5">Available</dt>
            <dd className="body-6 text-text-primary">{mentor.availability ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="caption-5">Sessions</dt>
            <dd className="body-6 text-text-primary">
              {mentor.sessionTypes.map((type) => SESSION_TYPE_LABEL[type] ?? type).join(", ") || "Not set"}
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-wrap gap-4">
        <PanelLink href={`/mentors/${mentor.id}`}>View public profile</PanelLink>
        <PanelLink href="/onboarding/mentor">Edit profile</PanelLink>
      </div>
    </Card>
  );
}
