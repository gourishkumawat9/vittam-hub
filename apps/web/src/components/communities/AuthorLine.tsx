import type { DiscussionAuthor } from "@vittamhub/api-client";
import type { UserRole } from "@vittamhub/types";
import { Avatar } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";

const ROLE_LABEL: Record<UserRole, string> = {
  FOUNDER: "Founder",
  INVESTOR: "Investor",
  MENTOR: "Mentor",
  INCUBATOR: "Incubator",
  UNIVERSITY: "University",
  SERVICE_PROVIDER: "Service provider",
  JOB_SEEKER: "Member",
  ADMIN: "VittamHub team",
};

/** Who said it and in what capacity: a founder's answer and an investor's answer carry different weight. */
export function AuthorLine({ author, createdAt, prefix }: { author: DiscussionAuthor; createdAt: string; prefix?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-text-secondary">
      <Avatar size="sm" src={author.avatarUrl} name={author.fullName} />
      <span className="truncate">
        {prefix && <span>{prefix} </span>}
        <span className="font-medium text-text-primary">{author.fullName}</span>
        <span> · {ROLE_LABEL[author.role]}</span>
        <span> · {formatRelativeTime(createdAt)}</span>
      </span>
    </div>
  );
}
