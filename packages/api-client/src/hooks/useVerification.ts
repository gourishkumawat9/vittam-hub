"use client";

import { useQuery } from "@tanstack/react-query";

import { verificationApi } from "../endpoints/verification";

export const verificationKeys = {
  mine: ["verification", "mine"] as const,
};

export function useMyVerification(enabled = true) {
  return useQuery({ queryKey: verificationKeys.mine, queryFn: verificationApi.mine, enabled });
}
