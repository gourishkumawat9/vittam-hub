export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * The questions founders ask before signing up, answered as the product
 * works today. Keep these true: when a rule changes (the free plan, how
 * verification works), change the answer here too.
 */
export const HOME_FAQ: FaqItem[] = [
  {
    question: "Is VittamHub free for founders?",
    answer:
      "Yes. Creating your startup profile, being listed in discovery, finding mentors and joining the community cost nothing. The free plan includes a set number of investor connect requests each month, and your dashboard shows how many you have left. Paid plans aren't live yet.",
  },
  {
    question: "Can I message an investor directly?",
    answer:
      "Not straight away, and that's on purpose. You send a connect request with a short introduction, what your startup does, what you're raising and, if you like, your pitch deck. Chat, document sharing and meetings open once the investor accepts.",
  },
  {
    question: "What does “Verified” mean on a profile?",
    answer:
      "It means the profile has the details and documents its type needs, such as incorporation details for a startup. Checks against government registries aren't automated yet, so the badge doesn't claim that a registry has confirmed them.",
  },
  {
    question: "Who can see the documents I upload?",
    answer:
      "Verification documents are kept in private storage, never on your public profile. A pitch deck you attach to a connect request opens only for you and that investor, through a link that expires.",
  },
  {
    question: "How do mentor sessions work?",
    answer:
      "You send a mentor a request with what you want to talk about and when you're free. If they accept, they set the time and share a meeting link. After the session either of you marks it done, and both of you can leave a short review.",
  },
  {
    question: "Do I need a finished profile to start?",
    answer:
      "No. Four short steps publish your profile and put it in discovery. Your deck, team and documents can come later, and you can edit the profile whenever you like.",
  },
];
