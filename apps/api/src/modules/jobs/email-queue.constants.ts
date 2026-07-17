export const EMAIL_QUEUE_NAME = "email";

/** Job names within the "email" queue — add new ones here as more emails move off the request/response path. */
export const EMAIL_JOB = {
  LOGIN_ALERT: "login-alert",
} as const;

export interface LoginAlertJobData {
  email: string;
  deviceLabel: string;
  ipAddress: string;
  timestamp: string;
}
