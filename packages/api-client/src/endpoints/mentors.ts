import type {
  CreateFounderReviewInput,
  CreateMentorBookingInput,
  FounderReview,
  MentorBookingRequestRecord,
  MentorProfileRecord,
  MentorSearchFilters,
  PaginatedResult,
  RespondToMentorBookingInput,
} from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/mentors` joins in the owner's public name/avatar for card display. */
export interface MentorWithOwner extends MentorProfileRecord {
  owner: { fullName: string; avatarUrl: string | null };
}

/** `GET /v1/mentors/bookings` joins in both parties + the startup so the UI never has to do follow-up fetches per row. */
export interface MentorBookingWithRelations extends MentorBookingRequestRecord {
  founder: { id: string; fullName: string; avatarUrl: string | null };
  mentor: { id: string; fullName: string; avatarUrl: string | null };
  startup: { id: string; name: string; slug: string; logoUrl: string | null } | null;
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
  getById: (id: string) => apiRequest<MentorWithOwner>(`/v1/mentors/${id}`),
  book: (id: string, input: CreateMentorBookingInput) =>
    apiRequest<MentorBookingRequestRecord>(`/v1/mentors/${id}/book`, { method: "POST", body: input }),
  listBookings: () => apiRequest<MentorBookingWithRelations[]>("/v1/mentors/bookings"),
  respondToBooking: (id: string, input: RespondToMentorBookingInput) =>
    apiRequest<MentorBookingRequestRecord>(`/v1/mentors/bookings/${id}/respond`, { method: "POST", body: input }),
  reviewBooking: (id: string, input: CreateFounderReviewInput) =>
    apiRequest<FounderReview>(`/v1/mentors/bookings/${id}/review`, { method: "POST", body: input }),
};
