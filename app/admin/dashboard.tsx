"use client";

import { useEffect, useState } from "react";
import { formatEventDate, isUpcomingEvent } from "../enquiry-format";
import type { ReminderDetails } from "../reminder-details";
import { EnquiryReview } from "./enquiry-review";
import { enquiryStatuses, type DashboardEnquiry, type DecisionStatus, type EnquiryFilter, type EnquiryPage } from "./types";

const filters = ["all", ...enquiryStatuses] as const;
const statusLabels = { all: "All enquiries", new: "New", booked: "Booked", rejected: "Rejected" };
const notificationLabels = {
  pending: "Email pending",
  sending: "Sending email",
  failed: "Email needs retry",
  sent: "Email accepted by Resend",
  expired: "Check email in Resend",
};
type EnquiryAction = DecisionStatus | "retry" | "reminder" | "retry-reminder";
type ActionDetails = { customerNote?: string; deliveryFee?: string; details?: ReminderDetails };
type UpdateEnquiry = (id: number, action: EnquiryAction, details?: ActionDetails) => Promise<string | null>;

const receivedDate = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
});

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : receivedDate.format(date);
}

export function Dashboard() {
  const [filter, setFilter] = useState<EnquiryFilter>("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<EnquiryPage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  function refresh() {
    setLoading(true);
    setLoadError("");
    setRefreshKey((key) => key + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/enquiries?status=${filter}&page=${page}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (response.status === 401 || response.status === 403) throw new Error("Please reopen the dashboard and sign in again.");
      if (!response.ok) throw new Error("Could not load enquiries. Try refreshing.");
      setData(await response.json() as EnquiryPage);
    }).catch((error: Error) => {
      if (!controller.signal.aborted) setLoadError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [filter, page, refreshKey]);

  const updateEnquiry: UpdateEnquiry = async (id, action, details = {}) => {
    setSaving(id);
    setFeedback("");
    const reminder = action === "reminder" || action === "retry-reminder";
    try {
      const response = await fetch(reminder ? "/api/admin/reminders" : "/api/admin/enquiries", {
        method: reminder ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, retry: action === "retry-reminder", ...details }),
      });
      const result = await response.json() as { error?: string; status?: DecisionStatus; emailSent?: boolean };
      if (!response.ok) throw new Error(result.error ?? "Could not confirm the action.");
      if (reminder) {
        setFeedback(result.emailSent
          ? `Resend accepted the reminder for booking #${id}.`
          : `The reminder for booking #${id} could not be confirmed. You can retry it from the booking.`);
      } else {
        setFeedback(result.emailSent
          ? `Enquiry #${id} is ${result.status}. Resend accepted the customer email.`
          : `Enquiry #${id} is ${result.status}. The email could not be confirmed. You can retry it from the enquiry.`);
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not confirm the change.";
      setFeedback(message);
      return message;
    } finally {
      setSaving(null);
      refresh();
    }
  };

  function changeFilter(next: EnquiryFilter) {
    if (next === filter) return;
    setFilter(next);
    setPage(1);
    refresh();
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-heading">
        <div><h1>Enquiries</h1><p>Review requests, send decisions and see your booking history.</p></div>
        <button className="admin-button" onClick={refresh} disabled={loading || saving !== null}>Refresh</button>
      </div>
      <nav className="admin-filters" aria-label="Filter enquiries">
        {filters.map((item) => (
          <button key={item} type="button" aria-pressed={item === filter} onClick={() => changeFilter(item)} disabled={saving !== null}>
            {statusLabels[item]} {data && <span>{data.counts[item]}</span>}
          </button>
        ))}
      </nav>
      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {loadError ? <p className="admin-feedback" role="alert">{loadError}</p> : (
        <section className="admin-list" aria-label={statusLabels[filter]} aria-busy={loading}>
          {loading && <p className="admin-list-message" role="status">Loading enquiries…</p>}
          {!loading && data?.enquiries.length === 0 && <p className="admin-list-message">No enquiries in this view yet.</p>}
          {data?.enquiries.map((enquiry) => (
            <EnquiryCard key={enquiry.id} enquiry={enquiry} busy={loading || saving !== null} saving={saving === enquiry.id} update={updateEnquiry} />
          ))}
        </section>
      )}
      {data && !loadError && data.totalPages > 1 && (
        <nav className="admin-pagination" aria-label="Enquiry pages">
          <button className="admin-button" disabled={loading || saving !== null || data.page <= 1} onClick={() => { setPage(data.page - 1); refresh(); }}>Previous</button>
          <span>Page {data.page} of {data.totalPages}</span>
          <button className="admin-button" disabled={loading || saving !== null || data.page >= data.totalPages} onClick={() => { setPage(data.page + 1); refresh(); }}>Next</button>
        </nav>
      )}
    </div>
  );
}

function EnquiryCard({ enquiry, busy, saving, update }: {
  enquiry: DashboardEnquiry;
  busy: boolean;
  saving: boolean;
  update: UpdateEnquiry;
}) {
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const outcome = enquiry.decision;
  const confirmed = outcome?.bookingDetails;
  const details = confirmed ?? enquiry;
  const date = formatEventDate(details.eventDate);
  const handover = confirmed ? (confirmed.handover === "collection" ? "Self-collection" : "Delivery") : enquiry.fulfilment;

  return (
    <details className="admin-enquiry">
      <summary>
        <span className="admin-enquiry-customer"><strong>{details.name}</strong><span>#{enquiry.id} · {details.eventType}</span></span>
        <span className="admin-enquiry-event"><strong>{date}</strong><span>{details.packageName ?? "Package not specified"}</span></span>
        <span className={`admin-status admin-status-${enquiry.status}`}>{statusLabels[enquiry.status]}</span>
        <span className="admin-chevron" aria-hidden="true" />
      </summary>
      <div className="admin-enquiry-details">
        <dl className="admin-details-grid">
          <div><dt>Received</dt><dd>{formatTimestamp(enquiry.createdAt)}</dd></div>
          <div><dt>Event date</dt><dd>{date}{details.startTime && ` · ${details.startTime}`}</dd></div>
          <div><dt>Venue</dt><dd>{details.venue}</dd></div>
          <div><dt>Guests</dt><dd>{details.guestCount}</dd></div>
          <div><dt>Tables</dt><dd>{details.games.join(", ")}</dd></div>
          <div><dt>Collection or delivery</dt><dd>{handover ?? "Not specified"}</dd></div>
          <div><dt>Email</dt><dd>{details.email}</dd></div>
          <div><dt>Phone</dt><dd>{details.phone}</dd></div>
          {confirmed?.arrangements && <div className="admin-full-width"><dt>Agreed handover</dt><dd className="admin-note">{confirmed.arrangements}</dd></div>}
          {enquiry.notes && <div className="admin-full-width"><dt>Customer notes</dt><dd className="admin-note">{enquiry.notes}</dd></div>}
        </dl>
        {outcome ? (
          <div className="admin-outcome">
            <p><strong>{statusLabels[enquiry.status]}</strong> by {outcome.decidedBy} · {formatTimestamp(outcome.decidedAt)}</p>
            {outcome.customerNote && <p className="admin-note"><strong>Customer email note:</strong> {outcome.customerNote}</p>}
            <p>{notificationLabels[outcome.notification]}</p>
            {outcome.notification === "expired" && <p>Check the Resend log before contacting the customer directly.</p>}
            {(outcome.notification === "failed" || outcome.notification === "pending") && (
              <button className="admin-button" disabled={busy} onClick={() => void update(enquiry.id, "retry")}>{saving ? "Sending…" : "Retry customer email"}</button>
            )}
          </div>
        ) : declining ? (
          <form className="admin-decision" onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            if (!(await update(enquiry.id, "rejected", { customerNote: note }))) {
              setDeclining(false);
              setNote("");
            }
          }}>
            <h2>Decline this enquiry?</h2>
            <p>This will mark the enquiry as rejected and email {enquiry.email}. The decision is final in this dashboard.</p>
            <label>Optional note to the customer<textarea value={note} maxLength={1500} rows={3} onChange={(event) => setNote(event.target.value)} disabled={busy} /></label>
            <div className="admin-actions">
              <button className="admin-button admin-danger" disabled={busy}>{saving ? "Saving…" : "Decline and email"}</button>
              <button type="button" className="admin-button" disabled={busy} onClick={() => { setDeclining(false); setNote(""); }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="admin-actions">
            <EnquiryReview enquiry={enquiry} mode="booking" label="Approve booking" busy={busy} saving={saving}
              send={(details, options) => update(enquiry.id, "booked", { details, ...options })} />
            <button className="admin-button" disabled={busy} onClick={() => setDeclining(true)}>Decline</button>
          </div>
        )}
        {enquiry.status === "booked" && outcome?.notification === "sent" && (
          <ReminderPanel enquiry={enquiry} busy={busy} saving={saving} update={update} />
        )}
      </div>
    </details>
  );
}

function ReminderPanel({ enquiry, busy, saving, update }: {
  enquiry: DashboardEnquiry;
  busy: boolean;
  saving: boolean;
  update: UpdateEnquiry;
}) {
  const [confirming, setConfirming] = useState(false);
  const reminder = enquiry.reminder;
  const confirmed = enquiry.decision?.bookingDetails;
  const canUseConfirmed = Boolean(confirmed?.arrangements && isUpcomingEvent(confirmed.eventDate));

  return (
    <section className="admin-decision" aria-label="Pre-event reminder">
      <h2>Pre-event reminder</h2>
      {reminder ? (
        <>
          <p>{reminder.sentAt ? `Email accepted by Resend on ${formatTimestamp(reminder.sentAt)}` : notificationLabels[reminder.notification]}</p>
          <p>Prepared for {reminder.to} for the event on {formatEventDate(reminder.eventDate)}.</p>
          {isUpcomingEvent(reminder.eventDate) && (reminder.notification === "failed" || reminder.notification === "pending") && (
            <button className="admin-button" disabled={busy} onClick={() => void update(enquiry.id, "retry-reminder")}>
              {saving ? "Sending…" : "Retry reminder email"}
            </button>
          )}
        </>
      ) : (
        <>
          {confirmed && canUseConfirmed && (
            <>
              <p>The reminder uses the confirmed details for {formatEventDate(confirmed.eventDate)} and goes to {confirmed.email}.</p>
              <p className="admin-note"><strong>{confirmed.handover === "delivery" ? "Delivery:" : "Self-collection:"}</strong> {confirmed.arrangements}</p>
            </>
          )}
          <div className="admin-actions">
            {canUseConfirmed && (confirming ? (
              <>
                <button type="button" className="admin-button admin-primary" disabled={busy}
                  onClick={async () => { if (!(await update(enquiry.id, "reminder"))) setConfirming(false); }}>
                  {saving ? "Sending…" : "Confirm and send reminder"}
                </button>
                <button type="button" className="admin-button" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
              </>
            ) : <button type="button" className="admin-button admin-primary" disabled={busy} onClick={() => setConfirming(true)}>Send reminder</button>)}
            {!confirming && <EnquiryReview enquiry={enquiry} mode="reminder" label={canUseConfirmed ? "Edit reminder details" : "Prepare reminder"}
              busy={busy} saving={saving} send={(details) => update(enquiry.id, "reminder", { details })} />}
          </div>
        </>
      )}
    </section>
  );
}
