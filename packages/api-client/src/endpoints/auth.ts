import type {
  ChangePasswordInput,
  ConfirmPasswordResetInput,
  LoginInput,
  MfaChallengeInput,
  MfaEnrollResponse,
  MfaRecoveryCodesResponse,
  MfaVerifyInput,
  RegisterInput,
  RequestPasswordResetInput,
  Session,
  User,
  VerifyOtpInput,
} from "@vittamhub/types";

import { apiRequest } from "../http";

export type LoginResult =
  | { mfaRequired: true; challengeToken: string }
  | { mfaRequired: false; user: User };

export const authApi = {
  register: (input: RegisterInput) =>
    apiRequest<{ user: User; requiresEmailVerification: boolean }>("/v1/auth/register", {
      method: "POST",
      body: input,
    }),
  login: (input: LoginInput) => apiRequest<LoginResult>("/v1/auth/login", { method: "POST", body: input }),
  completeMfaChallenge: (input: MfaChallengeInput) =>
    apiRequest<{ user: User }>("/v1/auth/mfa/challenge", { method: "POST", body: input }),
  logout: () => apiRequest<void>("/v1/auth/logout", { method: "POST" }),
  me: () => apiRequest<User>("/v1/auth/me"),

  resendVerificationEmail: () => apiRequest<{ sent: boolean }>("/v1/auth/verify-email/resend", { method: "POST" }),
  confirmVerificationEmail: (input: Pick<VerifyOtpInput, "code">) =>
    apiRequest<{ verified: boolean }>("/v1/auth/verify-email/confirm", { method: "POST", body: input }),

  forgotPassword: (input: RequestPasswordResetInput) =>
    apiRequest<{ sent: boolean }>("/v1/auth/password/forgot", { method: "POST", body: input }),
  resetPassword: (input: ConfirmPasswordResetInput) =>
    apiRequest<{ reset: boolean }>("/v1/auth/password/reset", { method: "POST", body: input }),
  changePassword: (input: ChangePasswordInput) =>
    apiRequest<{ changed: boolean }>("/v1/auth/password/change", { method: "POST", body: input }),

  beginMfaEnrollment: () => apiRequest<MfaEnrollResponse>("/v1/auth/mfa/enroll", { method: "POST" }),
  confirmMfaEnrollment: (input: MfaVerifyInput) =>
    apiRequest<{ enabled: boolean } & MfaRecoveryCodesResponse>("/v1/auth/mfa/enroll/confirm", {
      method: "POST",
      body: input,
    }),
  disableMfa: (input: MfaVerifyInput) => apiRequest<{ disabled: boolean }>("/v1/auth/mfa/disable", { method: "POST", body: input }),

  listSessions: () => apiRequest<Session[]>("/v1/auth/sessions"),
  revokeSession: (id: string) => apiRequest<{ revoked: boolean }>(`/v1/auth/sessions/${id}`, { method: "DELETE" }),
  revokeOtherSessions: () => apiRequest<{ revoked: boolean }>("/v1/auth/sessions", { method: "DELETE" }),

  captchaSiteKey: () => apiRequest<{ siteKey: string | null }>("/v1/auth/captcha-site-key"),
};
