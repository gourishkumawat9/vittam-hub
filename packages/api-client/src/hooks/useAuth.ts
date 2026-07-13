"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "../endpoints/auth";

const meKey = ["auth", "me"] as const;
const sessionsKey = ["auth", "sessions"] as const;

export function useCurrentUser() {
  return useQuery({ queryKey: meKey, queryFn: authApi.me, retry: false, staleTime: 60_000 });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => queryClient.setQueryData(meKey, user),
  });
}

/** Returns the union result as-is — the caller branches on `mfaRequired` to decide whether to show the MFA challenge step. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      if (!result.mfaRequired) queryClient.setQueryData(meKey, result.user);
    },
  });
}

export function useCompleteMfaChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.completeMfaChallenge,
    onSuccess: ({ user }) => queryClient.setQueryData(meKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.setQueryData(meKey, null),
  });
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

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword });
}

export function useCaptchaSiteKey() {
  return useQuery({ queryKey: ["auth", "captcha-site-key"], queryFn: authApi.captchaSiteKey, staleTime: Infinity });
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
