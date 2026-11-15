"use client";

import { useMutation } from "@tanstack/react-query";

import type { DeleteAccountInput } from "@vittamhub/types";

import { usersApi } from "../endpoints/users";

/** The confirmation dialog shows the error itself ("That password is incorrect"), so no toast. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (input: DeleteAccountInput) => usersApi.deleteMe(input),
    onError: () => undefined,
  });
}
