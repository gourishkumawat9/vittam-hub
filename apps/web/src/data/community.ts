export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: string;
  initials: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

/** Illustrative placeholder posts for the community preview strip. */
export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "1",
    authorName: "Nimbus Health",
    authorRole: "Startup update",
    initials: "NH",
    content: "Just crossed 10,000 patients screened through our rural diagnostics network. Huge thanks to our mentors.",
    likes: 142,
    comments: 18,
    timeAgo: "2h ago",
  },
  {
    id: "2",
    // A made-up mentor, not a VittamHub member: example posts must never announce real-sounding platform activity (CLAUDE.md §2).
    authorName: "Example Mentor",
    authorRole: "Mentor",
    initials: "EM",
    content: "Opening two office-hour slots this week for MVP-stage founders working on pricing. Send a session request with your question.",
    likes: 96,
    comments: 11,
    timeAgo: "5h ago",
  },
  {
    id: "3",
    authorName: "Ledgerly",
    authorRole: "Startup update",
    initials: "LG",
    content: "We're hosting a live AMA on small-business bookkeeping automation this Thursday. Drop your questions below.",
    likes: 64,
    comments: 27,
    timeAgo: "1d ago",
  },
];
