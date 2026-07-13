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
    authorName: "VittamHub Team",
    authorRole: "Announcement",
    initials: "VH",
    content: "Applications for the Q3 Incubator Spotlight cohort are now open — verified startups get priority review.",
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
