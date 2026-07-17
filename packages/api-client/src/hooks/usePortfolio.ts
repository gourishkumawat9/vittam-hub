"use client";

import { useQuery } from "@tanstack/react-query";

import { portfolioApi } from "../endpoints/portfolio";

export function usePortfolio() {
  return useQuery({ queryKey: ["portfolio"], queryFn: portfolioApi.list });
}
