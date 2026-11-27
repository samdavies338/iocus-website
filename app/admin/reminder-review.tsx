"use client";

import { useId, useRef, useState } from "react";
import { reminderGames, parseReminderDetails, type ReminderDetails } from "../reminder-details";
import type { DashboardEnquiry } from "./types";

export function ReminderReview({ enquiry, busy, saving, send }: {
  enquiry: DashboardEnquiry;
  busy: boolean;
  saving: boolean;
  send: (details: ReminderDetails) => Promise<string | null>;
}) {
  const heading = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const initialHandover = enquiry.fulfilment === "Collection" ? "collection"
    : enquiry.fulfilment === "Delivery quote" ? "delivery" : "";
  const [handover, setHandover] = useState(initialHandover);
  const [error, setError] = useState("");

  return (
    <>
      <button type="button" className="admin-button" disabled={busy} onClick={() => dialog.current?.showModal()}>
        Prepare reminder
      </button>
      <dialog ref={dialog} className="admin-reminder-dialog" aria-labelledby={heading}
        onCancel={(event) => { if (saving) event.preventDefault(); }}
        onClose={() => { setError(""); setHandover(initialHandover); dialog.current?.querySelector("form")?.reset(); }}>
        <form className="admin-reminder-form" onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const fields = new FormData(event.currentTarget);
          const details = parseReminderDetails({
            ...Object.fromEntries(fields),
            guestCount: Number(fields.get("guestCount")),
            games: fields.getAll("games"),
          });
          if (!details) {
            setError("Check the email, use an event date of today or later, and select at least one table and a handover option.");
            return;
          }
          setError("");
          const failure = await send(details);
          if (failure) setError(failure);
          else dialog.current?.close();
        }}>
          <h2 id={heading}>Review pre-event reminder</h2>
          <p>Update the details the customer will see. These edits apply to this reminder.</p>
          {error && <p className="admin-feedback" role="alert">{error}</p>}
          <fieldset disabled={busy} className="admin-reminder-fields">
            <legend className="admin-reminder-legend">Customer and event details</legend>
            <label>Customer name<input name="name" required maxLength={120} defaultValue={enquiry.name} /></label>
            <label>Send to email<input name="email" type="email" required maxLength={254} defaultValue={enquiry.email} /></label>
            <label>Contact phone (optional)<input name="phone" type="tel" maxLength={40} defaultValue={enquiry.phone} /></label>
            <label>Event type<input name="eventType" required maxLength={120} defaultValue={enquiry.eventType} /></label>
            <label>Event date<input name="eventDate" type="date" required defaultValue={enquiry.eventDate} /></label>
            <label>Start time (optional)<input name="startTime" type="time" defaultValue={enquiry.startTime} /></label>
            <label>Venue<input name="venue" required maxLength={250} defaultValue={enquiry.venue} /></label>
            <label>Guests<input name="guestCount" type="number" required min={1} max={10_000} defaultValue={enquiry.guestCount || undefined} /></label>
            <label>Package (optional)<input name="packageName" maxLength={120} defaultValue={enquiry.packageName ?? ""} /></label>
            <fieldset className="admin-reminder-choices">
              <legend>Tables</legend>
              {reminderGames.map((game) => (
                <label key={game}><input name="games" type="checkbox" value={game} defaultChecked={enquiry.games.includes(game)} />{game}</label>
              ))}
            </fieldset>
            <fieldset className="admin-reminder-choices admin-full-width">
              <legend>Handover method</legend>
              <label><input name="handover" type="radio" value="delivery" required checked={handover === "delivery"} onChange={() => setHandover("delivery")} />Delivery</label>
              <label><input name="handover" type="radio" value="collection" required checked={handover === "collection"} onChange={() => setHandover("collection")} />Self-collection</label>
            </fieldset>
            {handover && (
              <label className="admin-full-width">
                {handover === "delivery" ? "Delivery arrangements" : "Self-collection arrangements"}
                <textarea key={handover} name="arrangements" required rows={3} maxLength={500}
                  placeholder={handover === "delivery" ? "Delivery time, address and any return arrangements" : "Pickup and return times and location"} />
              </label>
            )}
          </fieldset>
          <div className="admin-actions">
            <button type="submit" className="admin-button admin-primary" disabled={busy}>{saving ? "Sending…" : "Send reminder email"}</button>
            <button type="button" className="admin-button" disabled={saving} onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
