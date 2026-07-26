"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceApi } from "../endpoints/workspace";

/** The Investor Workspace's Dashboard Home — pure composition, refetched on every mount so it's never stale for long. */
export function useWorkspaceHome() {
  return useQuery({ queryKey: ["workspace", "home"], queryFn: workspaceApi.home, retry: false });
}
