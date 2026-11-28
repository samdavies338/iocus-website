"use client";

import { useId, useRef, useState } from "react";
import { reminderGames, parseReminderDetails, type ReminderDetails } from "../reminder-details";
import { getPackageTerms, packageTerms } from "../package-terms";
import type { DashboardEnquiry } from "./types";

export function EnquiryReview({ enquiry, mode, label, busy, saving, send }: {
  enquiry: DashboardEnquiry;
  mode: "booking" | "reminder";
  label: string;
  busy: boolean;
  saving: boolean;
  send: (details: ReminderDetails, options: { customerNote: string; deliveryFee: string }) => Promise<string | null>;
}) {
  const heading = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const booking = mode === "booking";
  const confirmed = enquiry.decision?.bookingDetails;
  const detailsSource = confirmed ?? enquiry;
  const initialHandover = confirmed?.handover ?? (enquiry.fulfilment === "Collection" ? "collection"
    : enquiry.fulfilment === "Delivery quote" ? "delivery" : "");
  const [handover, setHandover] = useState(initialHandover);
  const [error, setError] = useState("");

  return (
    <>
      <button type="button" className={booking ? "admin-button admin-primary" : "admin-button"} disabled={busy} onClick={() => dialog.current?.showModal()}>
        {label}
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
          }, { requireArrangements: !booking });
          if (!details) {
            setError("Check the email, use an event date of today or later, and select at least one table and a handover option.");
            return;
          }
          if (booking && getPackageTerms(details.packageName)?.gameCount !== details.games.length) {
            setError("Select the number of tables included in the chosen package.");
            return;
          }
          setError("");
          const failure = await send(details, {
            customerNote: String(fields.get("customerNote") ?? ""),
            deliveryFee: String(fields.get("deliveryFee") ?? ""),
          });
          if (failure) setError(failure);
          else dialog.current?.close();
        }}>
          <h2 id={heading}>{booking ? "Review booking confirmation" : "Review pre-event reminder"}</h2>
          <p>{booking
            ? "Confirm the agreed details before marking this enquiry as booked and emailing the customer. These details will also be used for the pre-event reminder."
            : "Update the details the customer will see. These edits apply to this reminder."}</p>
          {error && <p className="admin-feedback" role="alert">{error}</p>}
          <fieldset disabled={busy} className="admin-reminder-fields">
            <legend className="admin-reminder-legend">Customer and event details</legend>
            <label>Customer name<input name="name" required maxLength={120} defaultValue={detailsSource.name} /></label>
            <label>Send to email<input name="email" type="email" required maxLength={254} defaultValue={detailsSource.email} /></label>
            <label>Contact phone (optional)<input name="phone" type="tel" maxLength={40} defaultValue={detailsSource.phone} /></label>
            <label>Event type<input name="eventType" required maxLength={120} defaultValue={detailsSource.eventType} /></label>
            <label>Event date<input name="eventDate" type="date" required defaultValue={detailsSource.eventDate} /></label>
            <label>Start time (optional)<input name="startTime" type="time" defaultValue={detailsSource.startTime} /></label>
            <label>Venue<input name="venue" required maxLength={250} defaultValue={detailsSource.venue} /></label>
            <label>Guests<input name="guestCount" type="number" required min={1} max={10_000} defaultValue={detailsSource.guestCount || undefined} /></label>
            {booking ? (
              <label>Package
                <select name="packageName" required defaultValue={getPackageTerms(detailsSource.packageName ?? "") ? detailsSource.packageName ?? "" : ""}>
                  <option value="" disabled>Choose a package</option>
                  {Object.entries(packageTerms).map(([name, terms]) => (
                    <option value={name} key={name}>{name} · {terms.price} · {terms.gameCount} {terms.gameCount === 1 ? "table" : "tables"}</option>
                  ))}
                </select>
              </label>
            ) : <label>Package (optional)<input name="packageName" maxLength={120} defaultValue={detailsSource.packageName ?? ""} /></label>}
            <fieldset className="admin-reminder-choices">
              <legend>Tables</legend>
              {reminderGames.map((game) => (
                <label key={game}><input name="games" type="checkbox" value={game} defaultChecked={detailsSource.games.includes(game)} />{game}</label>
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
                {booking && " (optional)"}
                <textarea key={handover} name="arrangements" required={!booking} rows={3} maxLength={500}
                  defaultValue={confirmed?.handover === handover ? confirmed.arrangements : ""}
                  placeholder={handover === "delivery" ? "Delivery time, address and any return arrangements" : "Pickup and return times and location"} />
              </label>
            )}
            {booking && handover === "delivery" && (
              <label className="admin-full-width">Agreed delivery and collection fee (£)
                <input name="deliveryFee" type="text" inputMode="decimal" pattern="[0-9]{1,5}(\.[0-9]{1,2})?" maxLength={8} placeholder="e.g. 35.00" />
                <small>Leave blank if the amount still needs to be confirmed.</small>
              </label>
            )}
            {booking && <label className="admin-full-width">Optional note to the customer<textarea name="customerNote" maxLength={1500} rows={2} /></label>}
          </fieldset>
          <div className="admin-actions">
            <button type="submit" className="admin-button admin-primary" disabled={busy}>
              {saving ? "Sending…" : booking ? "Confirm booking and email" : "Send reminder email"}
            </button>
            <button type="button" className="admin-button" disabled={saving} onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
