import type { enquiries } from "../../db/schema";
import { formatEventDate, readGames } from "../enquiry-format";
import { escapeHtml } from "../enquiry-mail";
import type { DecisionStatus } from "./types";

export function decisionEmail(
  enquiry: typeof enquiries.$inferSelect,
  status: DecisionStatus,
  customerNote: string,
) {
  const booked = status === "booked";
  const date = formatEventDate(enquiry.eventDate);
  const title = booked ? "Your casino night is booked" : "An update on your enquiry";
  const subject = booked ? `Iocus Casino booking confirmed for ${date}` : `Iocus Casino enquiry update for ${date}`;
  const intro = booked
    ? `Thanks for choosing Iocus Casino. We’ve booked your DIY casino table hire for ${date}.`
    : `Thank you for considering Iocus Casino. We’re unable to accept your table hire enquiry for ${date}.`;
  const next = booked
    ? "We’ll be in touch to confirm the final hire details, payment, refundable deposit and handover arrangements. You can reply to this email with any questions."
    : "If your dates are flexible, you’re welcome to reply and ask about another date.";
  const details = booked
    ? [
        ["Event date", date],
        ["Venue", enquiry.venue],
        ["Package", enquiry.packageName],
        ["Tables", readGames(enquiry.games).join(", ")],
        ["Collection or delivery", enquiry.fulfilment === "Delivery quote" ? "Delivery arrangements to be confirmed" : enquiry.fulfilment],
      ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    : [["Requested date", date]];

  const rows = details.map(([label, value]) =>
    `<tr><th scope="row" align="left" style="color:#62586a;font-size:14px;padding:8px 12px 8px 0">${escapeHtml(label)}</th><td style="color:#1b1025;padding:8px 0">${escapeHtml(value)}</td></tr>`
  ).join("");
  const noteHtml = customerNote
    ? `<p style="background:#f4eee4;border-left:3px solid #d4aa42;padding:14px 16px">${escapeHtml(customerNote).replaceAll("\n", "<br>")}</p>`
    : "";
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f4eee4;color:#1b1025;font:16px/1.55 Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4eee4"><tr><td align="center" style="padding:28px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fffdf8">
        <tr><td style="background:#1b1025;color:#d4aa42;border-bottom:3px solid #d4aa42;padding:22px 24px;font-weight:bold;letter-spacing:3px">IOCUS CASINO</td></tr>
        <tr><td style="padding:24px">
          <p style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#735718;font-weight:bold;margin:0">${booked ? "Booking confirmed" : "Enquiry update"}</p>
          <h1 style="font-size:28px;line-height:1.15;margin:8px 0 20px">${title}</h1>
          <p>Hi ${escapeHtml(enquiry.name)},</p><p>${escapeHtml(intro)}</p>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ded6c9;border-bottom:1px solid #ded6c9">${rows}</table>
          ${noteHtml}<p>${next}</p><p>Best wishes,<br>Iocus Casino</p>
        </td></tr>
        <tr><td style="background:#1b1025;color:#fffdf8;padding:16px 24px;font-size:13px">
          DIY casino table hire in East Devon &nbsp;·&nbsp; <a style="color:#f1d383" href="https://iocuscasino.com/">iocuscasino.com</a>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  const summary = details.map(([label, value]) => `${label}: ${value}`).join("\n");
  const text = [`Hi ${enquiry.name},`, intro, summary, customerNote, next, "Best wishes,\nIocus Casino\nhttps://iocuscasino.com/"].filter(Boolean).join("\n\n");

  return { subject, html, text };
}
