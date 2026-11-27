"use client";

import { useEffect, useState } from "react";
import { formatEventDate } from "../enquiry-format";
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

  async function updateEnquiry(id: number, action: DecisionStatus | "retry", customerNote = "") {
    setSaving(id);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, customerNote }),
      });
      const result = await response.json() as { error?: string; status?: DecisionStatus; emailSent?: boolean };
      if (!response.ok) throw new Error(result.error ?? "Could not save the decision.");
      setFeedback(result.emailSent
        ? `Enquiry #${id} is ${result.status}. Resend accepted the customer email.`
        : `Enquiry #${id} is ${result.status}. The email could not be confirmed. You can retry it from the enquiry.`);
      return true;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not confirm the change.");
      return false;
    } finally {
      setSaving(null);
      refresh();
    }
  }

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
  update: (id: number, action: DecisionStatus | "retry", note?: string) => Promise<boolean>;
}) {
  const [action, setAction] = useState<DecisionStatus | null>(null);
  const [note, setNote] = useState("");
  const date = formatEventDate(enquiry.eventDate);
  const outcome = enquiry.decision;

  return (
    <details className="admin-enquiry">
      <summary>
        <span className="admin-enquiry-customer"><strong>{enquiry.name}</strong><span>#{enquiry.id} · {enquiry.eventType}</span></span>
        <span className="admin-enquiry-event"><strong>{date}</strong><span>{enquiry.packageName ?? "Package not specified"}</span></span>
        <span className={`admin-status admin-status-${enquiry.status}`}>{statusLabels[enquiry.status]}</span>
        <span className="admin-chevron" aria-hidden="true" />
      </summary>
      <div className="admin-enquiry-details">
        <dl className="admin-details-grid">
          <div><dt>Received</dt><dd>{formatTimestamp(enquiry.createdAt)}</dd></div>
          <div><dt>Event date</dt><dd>{date}{enquiry.startTime && ` · ${enquiry.startTime}`}</dd></div>
          <div><dt>Venue</dt><dd>{enquiry.venue}</dd></div>
          <div><dt>Guests</dt><dd>{enquiry.guestCount}</dd></div>
          <div><dt>Tables</dt><dd>{enquiry.games.join(", ")}</dd></div>
          <div><dt>Collection or delivery</dt><dd>{enquiry.fulfilment ?? "Not specified"}</dd></div>
          <div><dt>Email</dt><dd>{enquiry.email}</dd></div>
          <div><dt>Phone</dt><dd>{enquiry.phone}</dd></div>
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
        ) : action ? (
          <form className="admin-decision" onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            if (await update(enquiry.id, action, note)) { setAction(null); setNote(""); }
          }}>
            <h2>{action === "booked" ? "Approve this booking?" : "Decline this enquiry?"}</h2>
            <p>This will mark the enquiry as {action} and email {enquiry.email}. The decision is final in this dashboard.</p>
            <label>Optional note to the customer<textarea value={note} maxLength={1500} rows={3} onChange={(event) => setNote(event.target.value)} disabled={busy} /></label>
            <div className="admin-actions">
              <button className={`admin-button ${action === "booked" ? "admin-primary" : "admin-danger"}`} disabled={busy}>{saving ? "Saving…" : action === "booked" ? "Confirm booking and email" : "Decline and email"}</button>
              <button type="button" className="admin-button" disabled={busy} onClick={() => { setAction(null); setNote(""); }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="admin-actions">
            <button className="admin-button admin-primary" disabled={busy} onClick={() => setAction("booked")}>Approve booking</button>
            <button className="admin-button" disabled={busy} onClick={() => setAction("rejected")}>Decline</button>
          </div>
        )}
      </div>
    </details>
  );
}
