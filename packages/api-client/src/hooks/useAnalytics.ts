"use client";

import { useQuery } from "@tanstack/react-query";

import { analyticsApi } from "../endpoints/analytics";

export function useInvestorAnalytics() {
  return useQuery({ queryKey: ["analytics"], queryFn: analyticsApi.get });
}

export function useInvestorRecommendations() {
  return useQuery({ queryKey: ["recommendations"], queryFn: analyticsApi.getRecommendations });
}

export function useFounderRecommendations() {
  return useQuery({ queryKey: ["recommendations", "founder"], queryFn: analyticsApi.getFounderRecommendations });
}
