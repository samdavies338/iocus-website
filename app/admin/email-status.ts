export const SEND_LEASE_MS = 60_000;
// Leave a margin inside Resend's 24-hour deduplication window.
export const RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

type DeliveryState = {
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  emailFailedAt: string | null;
  emailSentAt: string | null;
};

export function notificationState(row: DeliveryState) {
  if (row.emailSentAt) return "sent";
  if (row.firstAttemptAt && Date.parse(row.firstAttemptAt) <= Date.now() - RETRY_WINDOW_MS) {
    return "expired";
  }
  if (row.emailFailedAt) return "failed";
  if (!row.lastAttemptAt) return "pending";
  return Date.parse(row.lastAttemptAt) > Date.now() - SEND_LEASE_MS ? "sending" : "failed";
}
