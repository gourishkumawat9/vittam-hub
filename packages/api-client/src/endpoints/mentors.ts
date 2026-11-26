import type {
  CreateFounderReviewInput,
  CreateMentorBookingInput,
  CreateMentorReviewInput,
  FounderReview,
  MentorBookingRequestRecord,
  MentorProfileRecord,
  MentorReputation,
  MentorReview,
  MentorSearchFilters,
  PaginatedResult,
  RespondToMentorBookingInput,
  ScheduleMentorSessionInput,
  StartupStage,
} from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/mentors` joins in the owner's public name/avatar, plus reputation (avg rating + sessions) for card display. */
export interface MentorWithOwner extends MentorProfileRecord {
  owner: { fullName: string; avatarUrl: string | null };
  reputation: MentorReputation | null;
}

/** `GET /v1/mentors/:id` additionally includes reputation (avg rating + sessions) — spec §5's actual mentor-trust mechanism. */
export interface MentorWithReputation extends MentorWithOwner {
  reputation: MentorReputation;
}

/** `GET /v1/mentors/bookings` joins in both parties + the startup so the UI never has to do follow-up fetches per row. */
export interface MentorBookingWithRelations extends MentorBookingRequestRecord {
  founder: { id: string; fullName: string; avatarUrl: string | null };
  mentor: { id: string; fullName: string; avatarUrl: string | null };
  startup: { id: string; name: string; slug: string; logoUrl: string | null; stage: StartupStage; tagline: string } | null;
  /** Whether the signed-in user has already reviewed the other side for this session. */
  reviewedByMe: boolean;
}

export const mentorsApi = {
  list: (filters: MentorSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<MentorWithOwner>>(`/v1/mentors?${params.toString()}`);
  },
  getById: (id: string) => apiRequest<MentorWithReputation>(`/v1/mentors/${id}`),
  /** The signed-in mentor's own profile with reputation. Null before the mentor profile is published. */
  mine: () => apiRequest<MentorWithReputation | null>("/v1/mentors/me"),
  book: (id: string, input: CreateMentorBookingInput) =>
    apiRequest<MentorBookingRequestRecord>(`/v1/mentors/${id}/book`, { method: "POST", body: input }),
  listBookings: () => apiRequest<MentorBookingWithRelations[]>("/v1/mentors/bookings"),
  respondToBooking: (id: string, input: RespondToMentorBookingInput) =>
    apiRequest<MentorBookingRequestRecord>(`/v1/mentors/bookings/${id}/respond`, { method: "POST", body: input }),
  scheduleSession: (id: string, input: ScheduleMentorSessionInput) =>
    apiRequest<MentorBookingRequestRecord>(`/v1/mentors/bookings/${id}/schedule`, { method: "POST", body: input }),
  completeSession: (id: string) => apiRequest<MentorBookingRequestRecord>(`/v1/mentors/bookings/${id}/complete`, { method: "POST" }),
  reviewBooking: (id: string, input: CreateFounderReviewInput) =>
    apiRequest<FounderReview>(`/v1/mentors/bookings/${id}/review`, { method: "POST", body: input }),
  reviewMentor: (id: string, input: CreateMentorReviewInput) =>
    apiRequest<MentorReview>(`/v1/mentors/bookings/${id}/review-mentor`, { method: "POST", body: input }),
};
