import { env } from "cloudflare:workers";

type EmailMessage = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

export function getEnquiryMailConfig() {
  const { RESEND_API_KEY, ENQUIRY_FROM_EMAIL, ENQUIRY_TO_EMAIL } = env as typeof env & {
    RESEND_API_KEY?: string;
    ENQUIRY_FROM_EMAIL?: string;
    ENQUIRY_TO_EMAIL?: string;
  };
  return { apiKey: RESEND_API_KEY, from: ENQUIRY_FROM_EMAIL, ownerEmail: ENQUIRY_TO_EMAIL };
}

export const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export async function sendEmail(apiKey: string, message: EmailMessage, idempotencyKey: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}
