import { env } from "cloudflare:workers";
import { formatEventDate } from "../../enquiry-format";
import { escapeHtml, getEnquiryMailConfig, sendEmail } from "../../enquiry-mail";

type EnquiryData = {
  eventType: string;
  packageName: string;
  fulfilment: string;
  games: string[];
  eventDate: string;
  venue: string;
  guestCount: number;
  notes: string;
  name: string;
  email: string;
  phone: string;
};

const packageGameCounts: Record<string, number> = {
  "Single Package": 1,
  "Night Package": 2,
  "Full House Package": 3,
};
const availableGames = new Set(["Blackjack", "Poker", "Roulette"]);

async function sendEnquiryEmails(data: EnquiryData, enquiryId: string) {
  const { apiKey, from, ownerEmail } = getEnquiryMailConfig();

  if (!apiKey || !from || !ownerEmail) return false;

  const eventDate = formatEventDate(data.eventDate);
  const safe = {
    name: escapeHtml(data.name), email: escapeHtml(data.email), phone: escapeHtml(data.phone),
    eventType: escapeHtml(data.eventType), packageName: escapeHtml(data.packageName),
    games: escapeHtml(data.games.join(", ")), eventDate: escapeHtml(eventDate),
    venue: escapeHtml(data.venue), guestCount: escapeHtml(data.guestCount),
    fulfilment: escapeHtml(data.fulfilment), notes: escapeHtml(data.notes || "None supplied"),
  };

  const ownerText = `New Iocus Casino enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nEvent: ${data.eventType}\nPackage: ${data.packageName}\nTables: ${data.games.join(", ")}\nDate: ${eventDate}\nVenue: ${data.venue}\nGuests: ${data.guestCount}\nCollection or delivery: ${data.fulfilment}\nNotes: ${data.notes || "None supplied"}`;
  const ownerHtml = `<h1>New Iocus Casino enquiry</h1><table cellpadding="7" cellspacing="0" style="border-collapse:collapse"><tr><td><strong>Name</strong></td><td>${safe.name}</td></tr><tr><td><strong>Email</strong></td><td>${safe.email}</td></tr><tr><td><strong>Phone</strong></td><td>${safe.phone}</td></tr><tr><td><strong>Event</strong></td><td>${safe.eventType}</td></tr><tr><td><strong>Package</strong></td><td>${safe.packageName}</td></tr><tr><td><strong>Tables</strong></td><td>${safe.games}</td></tr><tr><td><strong>Date</strong></td><td>${safe.eventDate}</td></tr><tr><td><strong>Venue</strong></td><td>${safe.venue}</td></tr><tr><td><strong>Guests</strong></td><td>${safe.guestCount}</td></tr><tr><td><strong>Collection or delivery</strong></td><td>${safe.fulfilment}</td></tr><tr><td><strong>Notes</strong></td><td>${safe.notes}</td></tr></table>`;

  const customerText = `Hi ${data.name},\n\nThanks for your Iocus Casino enquiry. We have received your details for ${eventDate} and will be in touch to confirm availability and provide a quote.\n\nThere is no payment or booking commitment at this stage.\n\nIocus Casino`;
  const customerHtml = `<p>Hi ${safe.name},</p><p>Thanks for your Iocus Casino enquiry. We have received your details for <strong>${safe.eventDate}</strong> and will be in touch to confirm availability and provide a quote.</p><p>There is no payment or booking commitment at this stage.</p><p>Iocus Casino</p>`;

  const results = await Promise.allSettled([
    sendEmail(apiKey, { from, to: [ownerEmail], reply_to: data.email, subject: `New Iocus Casino enquiry — ${data.name}, ${eventDate}`, html: ownerHtml, text: ownerText }, `iocus-owner-${enquiryId}`),
    sendEmail(apiKey, { from, to: [data.email], subject: "We’ve received your Iocus Casino enquiry", html: customerHtml, text: customerText }, `iocus-customer-${enquiryId}`),
  ]);
  return results.every((result) => result.status === "fulfilled");
}

export async function POST(request: Request) {
  try {
    const raw = await request.json() as Record<string, unknown>;
    const required = ["eventType", "packageName", "fulfilment", "eventDate", "venue", "name", "email", "phone"];
    if (required.some((field) => typeof raw[field] !== "string" || !String(raw[field]).trim()) || !Array.isArray(raw.games) || raw.games.length === 0) {
      return Response.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const data: EnquiryData = {
      eventType: String(raw.eventType).trim(), packageName: String(raw.packageName).trim(),
      fulfilment: String(raw.fulfilment).trim(), games: raw.games.map(String),
      eventDate: String(raw.eventDate).trim(), venue: String(raw.venue).trim(),
      guestCount: Number(raw.guestCount) || 0, notes: String(raw.notes || "").trim(),
      name: String(raw.name).trim(), email: String(raw.email).trim(), phone: String(raw.phone).trim(),
    };

    const requiredGameCount = packageGameCounts[data.packageName];
    const uniqueGames = new Set(data.games);
    if (!requiredGameCount || uniqueGames.size !== data.games.length || data.games.length !== requiredGameCount || data.games.some((game) => !availableGames.has(game))) {
      return Response.json({ error: "Please select the correct number of tables for your package." }, { status: 400 });
    }

    const result = await env.DB.prepare(`INSERT INTO enquiries (created_at, event_type, package_name, fulfilment, games, event_date, start_time, venue, guest_count, notes, name, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(new Date().toISOString(), data.eventType, data.packageName, data.fulfilment, JSON.stringify(data.games), data.eventDate, "", data.venue, data.guestCount, data.notes, data.name, data.email, data.phone)
      .run();

    const enquiryId = String(result.meta.last_row_id ?? crypto.randomUUID());
    const emailsSent = await sendEnquiryEmails(data, enquiryId);
    return Response.json({ ok: true, emailsSent }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save the enquiry." }, { status: 500 });
  }
}
