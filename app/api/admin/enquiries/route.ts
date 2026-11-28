import { and, count, desc, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enquiries, enquiryDecisions, enquiryReminders } from "../../../../db/schema";
import { getAdminAccess } from "../../../admin/access";
import { decisionEmail } from "../../../admin/decision-email";
import { notificationState, RETRY_WINDOW_MS, SEND_LEASE_MS } from "../../../admin/email-status";
import type { DashboardEnquiry, EnquiryPage } from "../../../admin/types";
import { readGames } from "../../../enquiry-format";
import { bookingConfirmation } from "../../../enquiry-confirmation";
import { getEnquiryMailConfig, sendEmail } from "../../../enquiry-mail";
import { getPackageTerms, parsePriceInPence } from "../../../package-terms";
import { parseReminderDetails } from "../../../reminder-details";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const decision = enquiryDecisions;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "allowed") {
    return json({ error: "Staff sign-in required." }, 401);
  }

  try {
    const db = getDb();
    const params = new URL(request.url).searchParams;
    const filter = params.get("status");
    const requestedPage = Number(params.get("page") ?? "1");
    const summary = await db.select({ status: decision.status, total: count() })
      .from(enquiries)
      .leftJoin(decision, eq(decision.enquiryId, enquiries.id))
      .groupBy(decision.status);
    const counts: EnquiryPage["counts"] = { all: 0, new: 0, booked: 0, rejected: 0 };
    for (const row of summary) {
      counts[row.status ?? "new"] = row.total;
      counts.all += row.total;
    }
    const activeFilter = filter === "new" || filter === "booked" || filter === "rejected" ? filter : "all";
    const totalPages = Math.max(1, Math.ceil(counts[activeFilter] / PAGE_SIZE));
    const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, totalPages)) : 1;
    const where = activeFilter === "new" ? isNull(decision.enquiryId)
      : activeFilter === "all" ? undefined : eq(decision.status, activeFilter);
    const rows = await db.select({ record: enquiries, outcome: decision, reminder: enquiryReminders })
      .from(enquiries)
      .leftJoin(decision, eq(decision.enquiryId, enquiries.id))
      .leftJoin(enquiryReminders, eq(enquiryReminders.enquiryId, enquiries.id))
      .where(where)
      .orderBy(desc(enquiries.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    return json({
      counts, totalPages, page,
      enquiries: rows.map(({ record, outcome, reminder }): DashboardEnquiry => ({
        ...record,
        games: readGames(record.games),
        status: outcome?.status ?? "new",
        decision: outcome ? {
          decidedAt: outcome.decidedAt,
          decidedBy: outcome.decidedBy,
          customerNote: outcome.customerNote,
          notification: notificationState(outcome),
          bookingDetails: outcome.bookingDetails,
        } : null,
        reminder: reminder ? {
          notification: notificationState(reminder), sentAt: reminder.emailSentAt,
          eventDate: reminder.message?.eventDate ?? record.eventDate,
          to: reminder.message?.to ?? record.email,
        } : null,
      })),
    } satisfies EnquiryPage);
  } catch {
    return json({ error: "Could not load enquiries. Please try again." }, 500);
  }
}

export async function PATCH(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "allowed") {
    return json({ error: "Staff sign-in required." }, 401);
  }
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "Open the dashboard directly to make changes." }, 403);
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return json({ error: "Expected a JSON request." }, 415);
  }

  const raw = await request.json().catch(() => null) as { id?: unknown; action?: unknown; customerNote?: unknown; deliveryFee?: unknown; details?: unknown } | null;
  const id = raw?.id;
  const action = raw?.action;
  const inputNote = raw?.customerNote ?? "";
  const inputFee = raw?.deliveryFee ?? "";
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1 ||
      (action !== "booked" && action !== "rejected" && action !== "retry") ||
      typeof inputNote !== "string" || inputNote.length > 1500 || typeof inputFee !== "string") {
    return json({ error: "Choose a valid enquiry and action, with a note of up to 1,500 characters." }, 400);
  }
  const { apiKey, from, ownerEmail } = getEnquiryMailConfig();
  if (!apiKey || !from || !ownerEmail) return json({ error: "Email is unavailable. Please try again later." }, 503);

  try {
    const db = getDb();
    const [record] = await db.select().from(enquiries).where(eq(enquiries.id, id));
    if (!record) return json({ error: "This enquiry could not be found." }, 404);

    if (action !== "retry") {
      const booking = action === "booked";
      const bookingDetails = booking ? parseReminderDetails(raw?.details, { requireArrangements: false }) : null;
      if (booking && !bookingDetails) {
        return json({ error: "Review the booking details, including the customer email, date and handover method, before approving." }, 400);
      }
      const packageTerms = bookingDetails ? getPackageTerms(bookingDetails.packageName) : undefined;
      if (bookingDetails && (!packageTerms || bookingDetails.games.length !== packageTerms.gameCount)) {
        return json({ error: "Choose a package and select the number of tables it includes." }, 400);
      }
      const fee = inputFee.trim() ? parsePriceInPence(inputFee.trim()) : null;
      if (booking && inputFee.trim() && fee === null) {
        return json({ error: "Enter the delivery fee in pounds and pence, for example 35.00." }, 400);
      }
      const [created] = await db.insert(decision).values({
        enquiryId: id,
        status: action,
        decidedAt: new Date().toISOString(),
        decidedBy: access.user.email,
        customerNote: inputNote.trim(),
        packagePricePence: packageTerms ? parsePriceInPence(packageTerms.price.slice(1)) : null,
        deliveryFeePence: bookingDetails?.handover === "collection" ? 0 : booking ? fee : null,
        bookingTemplateVersion: booking ? 4 : null,
        bookingDetails,
      }).onConflictDoNothing().returning({ id: decision.enquiryId });
      if (!created) return json({ error: "This enquiry has already been decided. Refresh to see its current status." }, 409);
    }

    const now = Date.now();
    const attemptedAt = new Date(now).toISOString();
    const staleBefore = new Date(now - SEND_LEASE_MS).toISOString();
    const retryAfter = new Date(now - RETRY_WINDOW_MS).toISOString();
    const [previous] = await db.select().from(decision).where(eq(decision.enquiryId, id));
    if (!previous) return json({ error: "Make a decision before sending a status email." }, 409);

    // Claim the send before contacting Resend. Another request can only take over a stale lease.
    const [claimed] = await db.update(decision).set({
      firstAttemptAt: sql`coalesce(${decision.firstAttemptAt}, ${attemptedAt})`,
      lastAttemptAt: attemptedAt,
      emailFailedAt: null,
    }).where(and(
      eq(decision.enquiryId, id),
      isNull(decision.emailSentAt),
      or(isNull(decision.firstAttemptAt), gt(decision.firstAttemptAt, retryAfter)),
      or(isNull(decision.lastAttemptAt), lt(decision.lastAttemptAt, staleBefore), isNotNull(decision.emailFailedAt)),
    )).returning();
    if (!claimed) {
      return json({ error: "The email has already been sent, is sending, or is past its retry window. Refresh to see its current status." }, 409);
    }

    try {
      // Keep a previously attempted payload stable for Resend retries.
      const templateVersion = claimed.bookingTemplateVersion;
      const reviewed = claimed.bookingDetails;
      const message = claimed.status === "booked" && (templateVersion === 2 || templateVersion === 3 || templateVersion === 4)
        ? bookingConfirmation(
            reviewed ? { ...reviewed, fulfilment: null } : record,
            claimed.packagePricePence, claimed.deliveryFeePence, claimed.customerNote, templateVersion !== 2, reviewed ?? undefined,
          )
        : decisionEmail(record, claimed.status, claimed.customerNote);
      await sendEmail(apiKey, {
        from, to: [reviewed?.email ?? record.email], reply_to: ownerEmail,
        ...message,
      }, `iocus-decision-${id}-${claimed.status}`);
    } catch {
      await db.update(decision).set({ emailFailedAt: new Date().toISOString() })
        .where(and(eq(decision.enquiryId, id), eq(decision.lastAttemptAt, attemptedAt)));
      return json({ status: claimed.status, emailSent: false });
    }
    await db.update(decision).set({ emailSentAt: new Date().toISOString() })
      .where(and(eq(decision.enquiryId, id), eq(decision.lastAttemptAt, attemptedAt)));
    return json({ status: claimed.status, emailSent: true });
  } catch {
    return json({ error: "The action could not be confirmed. Refresh to check the saved status before trying again." }, 500);
  }
}
