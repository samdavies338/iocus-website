import { and, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enquiries, enquiryDecisions, enquiryReminders } from "../../../../db/schema";
import { getAdminAccess } from "../../../admin/access";
import { RETRY_WINDOW_MS, SEND_LEASE_MS } from "../../../admin/email-status";
import { legacyPreEventReminder, reviewedPreEventReminder } from "../../../enquiry-confirmation";
import { isUpcomingEvent } from "../../../enquiry-format";
import { getEnquiryMailConfig, sendEmail } from "../../../enquiry-mail";
import { parseReminderDetails } from "../../../reminder-details";

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

  const raw = await request.json().catch(() => null) as { id?: unknown; retry?: unknown; details?: unknown } | null;
  const id = raw?.id;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: "Choose a valid booking." }, { status: 400 });
  }
  const { apiKey, from, ownerEmail } = getEnquiryMailConfig();
  if (!apiKey || !from || !ownerEmail) return Response.json({ error: "Email is unavailable. Please try again later." }, { status: 503 });

  try {
    const db = getDb();
    const [booking] = await db.select({ enquiry: enquiries, decision: enquiryDecisions }).from(enquiries)
      .innerJoin(enquiryDecisions, eq(enquiryDecisions.enquiryId, enquiries.id))
      .where(eq(enquiries.id, id));
    if (!booking || booking.decision.status !== "booked" || !booking.decision.emailSentAt) {
      return Response.json({ error: "Send the booking confirmation before preparing a reminder." }, { status: 409 });
    }

    if (raw?.retry === true) {
      const [previous] = await db.select({ message: reminders.message }).from(reminders).where(eq(reminders.enquiryId, id));
      if (!previous || !isUpcomingEvent(previous.message?.eventDate ?? booking.enquiry.eventDate)) {
        return Response.json({ error: "There is no saved reminder to retry for an upcoming event." }, { status: 409 });
      }
    } else {
      const details = parseReminderDetails(raw?.details ?? booking.decision.bookingDetails);
      if (!details) {
        return Response.json({ error: "Check the name, email, event date, guest count, selected tables and handover details." }, { status: 400 });
      }
      const [created] = await db.insert(reminders).values({
        enquiryId: id,
        delivery: details.handover === "delivery" ? details.arrangements : "",
        collection: details.handover === "collection" ? details.arrangements : "",
        message: { to: details.email, eventDate: details.eventDate, ...reviewedPreEventReminder(details) },
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
      const { to, subject, text, html } = claimed.message ?? {
        to: booking.enquiry.email,
        ...legacyPreEventReminder(booking.enquiry, claimed.delivery, claimed.collection),
      };
      await sendEmail(apiKey, {
        from, to: [to], reply_to: ownerEmail, subject, text, html,
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
