"use client";

import type { CreateFounderReviewInput, CreateMentorBookingInput, MentorSearchFilters, RespondToMentorBookingInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mentorsApi } from "../endpoints/mentors";

const mentorKeys = {
  all: ["mentors"] as const,
  list: (filters: MentorSearchFilters) => [...mentorKeys.all, filters] as const,
  detail: (id: string) => ["mentors", id] as const,
  bookings: ["mentors", "bookings"] as const,
};

export function useMentors(filters: MentorSearchFilters) {
  return useQuery({ queryKey: mentorKeys.list(filters), queryFn: () => mentorsApi.list(filters) });
}

export function useMentor(id: string) {
  return useQuery({ queryKey: mentorKeys.detail(id), queryFn: () => mentorsApi.getById(id), enabled: !!id });
}

export function useMentorBookings() {
  return useQuery({ queryKey: mentorKeys.bookings, queryFn: mentorsApi.listBookings });
}

export function useBookMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateMentorBookingInput }) => mentorsApi.book(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mentorKeys.bookings }),
  });
}

export function useRespondToMentorBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RespondToMentorBookingInput }) => mentorsApi.respondToBooking(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mentorKeys.bookings }),
  });
}

export function useReviewMentorBooking() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateFounderReviewInput }) => mentorsApi.reviewBooking(id, input),
  });
}
