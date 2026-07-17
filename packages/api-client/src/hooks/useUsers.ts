"use client";

import { useMutation } from "@tanstack/react-query";

import { usersApi } from "../endpoints/users";

export function useDeleteAccount() {
  return useMutation({ mutationFn: usersApi.deleteMe });
}
