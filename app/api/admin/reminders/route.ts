import { and, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enquiries, enquiryDecisions, enquiryReminders } from "../../../../db/schema";
import { getAdminAccess } from "../../../admin/access";
import { RETRY_WINDOW_MS, SEND_LEASE_MS } from "../../../admin/email-status";
import { preEventReminder } from "../../../enquiry-confirmation";
import { isUpcomingEvent } from "../../../enquiry-format";
import { getEnquiryMailConfig, sendEmail } from "../../../enquiry-mail";

export const dynamic = "force-dynamic";

const reminders = enquiryReminders;

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "allowed") return Response.json({ error: "Staff sign-in required." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Open the dashboard directly to send a reminder." }, { status: 403 });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Expected a JSON request." }, { status: 415 });
  }

  const raw = await request.json().catch(() => null) as { id?: unknown; retry?: unknown; delivery?: unknown; collection?: unknown } | null;
  const id = raw?.id;
  const delivery = raw?.delivery ?? "";
  const collection = raw?.collection ?? "";
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1 ||
      typeof delivery !== "string" || delivery.length > 500 ||
      typeof collection !== "string" || collection.length > 500) {
    return Response.json({ error: "Specify a booking and keep each handover detail under 500 characters." }, { status: 400 });
  }
  const { apiKey, from, ownerEmail } = getEnquiryMailConfig();
  if (!apiKey || !from || !ownerEmail) return Response.json({ error: "Email is unavailable. Please try again later." }, { status: 503 });

  try {
    const db = getDb();
    const [booking] = await db.select({ enquiry: enquiries, decision: enquiryDecisions }).from(enquiries)
      .innerJoin(enquiryDecisions, eq(enquiryDecisions.enquiryId, enquiries.id))
      .where(eq(enquiries.id, id));
    if (!booking || booking.decision.status !== "booked" || !booking.decision.emailSentAt || !isUpcomingEvent(booking.enquiry.eventDate)) {
      return Response.json({ error: "Reminders are available for upcoming bookings once the confirmation email has been sent." }, { status: 409 });
    }

    if (raw?.retry !== true) {
      const selfCollection = booking.enquiry.fulfilment === "Collection";
      if (!collection.trim() || (!selfCollection && !delivery.trim())) {
        return Response.json({ error: "Enter the agreed handover arrangements before sending." }, { status: 400 });
      }
      const [created] = await db.insert(reminders).values({
        enquiryId: id, delivery: selfCollection ? "" : delivery.trim(), collection: collection.trim(),
      }).onConflictDoNothing().returning({ id: reminders.enquiryId });
      if (!created) {
        return Response.json({ error: "A reminder already exists for this booking. Refresh to see its email status." }, { status: 409 });
      }
    }

    const now = Date.now();
    const attemptedAt = new Date(now).toISOString();
    const [claimed] = await db.update(reminders).set({
      firstAttemptAt: sql`coalesce(${reminders.firstAttemptAt}, ${attemptedAt})`,
      lastAttemptAt: attemptedAt,
      emailFailedAt: null,
    }).where(and(
      eq(reminders.enquiryId, id),
      isNull(reminders.emailSentAt),
      or(isNull(reminders.firstAttemptAt), gt(reminders.firstAttemptAt, new Date(now - RETRY_WINDOW_MS).toISOString())),
      or(isNull(reminders.lastAttemptAt), lt(reminders.lastAttemptAt, new Date(now - SEND_LEASE_MS).toISOString()), isNotNull(reminders.emailFailedAt)),
    )).returning();
    if (!claimed) {
      return Response.json({ error: "This reminder cannot be sent again. Refresh to see its email status." }, { status: 409 });
    }

    const currentAttempt = and(eq(reminders.enquiryId, id), eq(reminders.lastAttemptAt, attemptedAt));
    try {
      await sendEmail(apiKey, {
        from, to: [booking.enquiry.email], reply_to: ownerEmail,
        ...preEventReminder(booking.enquiry, claimed.delivery, claimed.collection),
      }, `iocus-pre-event-${id}`);
    } catch {
      await db.update(reminders).set({ emailFailedAt: new Date().toISOString() }).where(currentAttempt);
      return Response.json({ emailSent: false });
    }
    await db.update(reminders).set({ emailSentAt: new Date().toISOString() }).where(currentAttempt);
    return Response.json({ emailSent: true });
  } catch {
    return Response.json({ error: "The reminder could not be confirmed. Refresh to check its email status before retrying." }, { status: 500 });
  }
}
