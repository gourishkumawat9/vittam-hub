export interface CommunityPost {
  id: string;
  author: string;
  initials: string;
  kind: "Startup update" | "Poll" | "Event";
  content: string;
  pollOptions?: string[];
  eventDetail?: string;
}

/**
 * Made-up posts for the home page's community preview, one of each post type
 * the feed supports. Every author is named "Example …" and there are no like
 * or comment counts, so nothing reads as real activity (CLAUDE.md §2).
 */
export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "update",
    author: "Example Startup",
    initials: "ES",
    kind: "Startup update",
    content: "We shipped our MVP to our first pilot schools this month. Next milestone: our first paid plan.",
  },
  {
    id: "poll",
    author: "Example Mentor",
    initials: "EM",
    kind: "Poll",
    content: "Founders: what's been hardest about your first fundraise?",
    pollOptions: ["Finding the right investors", "Valuation", "The pitch deck"],
  },
  {
    id: "event",
    author: "Example Incubator",
    initials: "EI",
    kind: "Event",
    content: "Online info session for our pre-incubation programme. Open to founders at the idea and MVP stages.",
    eventDetail: "Online · RSVP from the feed",
  },
];
