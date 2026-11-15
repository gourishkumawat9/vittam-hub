"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { User } from "@vittamhub/types";

import { authApi } from "../endpoints/auth";

const meKey = ["auth", "me"] as const;
const sessionsKey = ["auth", "sessions"] as const;

export function useCurrentUser() {
  return useQuery({ queryKey: meKey, queryFn: authApi.me, retry: false, staleTime: 60_000 });
}

/** The few cached answers that are the same for everyone, signed in or not. */
const PUBLIC_AUTH_KEYS = new Set(["captcha-site-key", "oauth-providers"]);

/**
 * Called the moment someone signs in: drops everything cached for whoever
 * used this tab before. Without it, a second person signing in within a few
 * minutes was shown the first person's dashboard, notifications and
 * onboarding answers from the cache until each one happened to refetch.
 */
function startSession(queryClient: QueryClient, user: User) {
  queryClient.removeQueries({
    predicate: (query) => !(query.queryKey[0] === "auth" && PUBLIC_AUTH_KEYS.has(String(query.queryKey[1]))),
  });
  queryClient.setQueryData(meKey, user);
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => startSession(queryClient, user),
  });
}

/** Returns the union result as-is — the caller branches on `mfaRequired` to decide whether to show the MFA challenge step. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      if (!result.mfaRequired) startSession(queryClient, result.user);
    },
  });
}

export function useCompleteMfaChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.completeMfaChallenge,
    onSuccess: ({ user }) => startSession(queryClient, user),
  });
}

/**
 * Signs out on the server. The caller should then load the next page afresh
 * (`window.location.assign`), which is what clears this tab's cached data;
 * emptying the cache here instead would make every screen still on the page
 * refetch as a signed-out visitor first.
 */
export function useLogout() {
  return useMutation({ mutationFn: authApi.logout });
}

export function useResendVerificationEmail() {
  return useMutation({ mutationFn: authApi.resendVerificationEmail });
}

export function useConfirmVerificationEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.confirmVerificationEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

/** Changing the password signs every other device out, so the list of them is refetched. The form shows the error itself. */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
    onError: () => undefined,
  });
}

export function useCaptchaSiteKey() {
  return useQuery({ queryKey: ["auth", "captcha-site-key"], queryFn: authApi.captchaSiteKey, staleTime: Infinity });
}

/** The sign-in providers the API holds keys for. Empty until it answers, so a button never appears that can't work. */
export function useOAuthProviders() {
  return useQuery({ queryKey: ["auth", "oauth-providers"], queryFn: authApi.oauthProviders, staleTime: Infinity });
}

// ─── MFA enrollment ─────────────────────────────────────────────────────

export function useBeginMfaEnrollment() {
  return useMutation({ mutationFn: authApi.beginMfaEnrollment });
}

export function useConfirmMfaEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.confirmMfaEnrollment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useDisableMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.disableMfa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

// ─── Sessions ───────────────────────────────────────────────────────────

export function useSessions() {
  return useQuery({ queryKey: sessionsKey, queryFn: authApi.listSessions });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.revokeOtherSessions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}
