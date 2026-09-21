import { env } from "cloudflare:workers";

const createTableSql = `CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  package_name TEXT,
  fulfilment TEXT,
  games TEXT NOT NULL,
  event_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  notes TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL
)`;

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

type EmailMessage = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

async function sendEmail(apiKey: string, message: EmailMessage, idempotencyKey: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

async function sendEnquiryEmails(data: EnquiryData, enquiryId: string) {
  const runtimeEnv = env as typeof env & {
    RESEND_API_KEY?: string;
    ENQUIRY_FROM_EMAIL?: string;
    ENQUIRY_TO_EMAIL?: string;
  };
  const apiKey = runtimeEnv.RESEND_API_KEY;
  const from = runtimeEnv.ENQUIRY_FROM_EMAIL;
  const ownerEmail = runtimeEnv.ENQUIRY_TO_EMAIL;

  if (!apiKey || !from || !ownerEmail) return false;

  const safe = {
    name: escapeHtml(data.name), email: escapeHtml(data.email), phone: escapeHtml(data.phone),
    eventType: escapeHtml(data.eventType), packageName: escapeHtml(data.packageName),
    games: escapeHtml(data.games.join(", ")), eventDate: escapeHtml(data.eventDate),
    venue: escapeHtml(data.venue), guestCount: escapeHtml(data.guestCount),
    fulfilment: escapeHtml(data.fulfilment), notes: escapeHtml(data.notes || "None supplied"),
  };

  const ownerText = `New Iocus Casino enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nEvent: ${data.eventType}\nPackage: ${data.packageName}\nTables: ${data.games.join(", ")}\nDate: ${data.eventDate}\nVenue: ${data.venue}\nGuests: ${data.guestCount}\nCollection or delivery: ${data.fulfilment}\nNotes: ${data.notes || "None supplied"}`;
  const ownerHtml = `<h1>New Iocus Casino enquiry</h1><table cellpadding="7" cellspacing="0" style="border-collapse:collapse"><tr><td><strong>Name</strong></td><td>${safe.name}</td></tr><tr><td><strong>Email</strong></td><td>${safe.email}</td></tr><tr><td><strong>Phone</strong></td><td>${safe.phone}</td></tr><tr><td><strong>Event</strong></td><td>${safe.eventType}</td></tr><tr><td><strong>Package</strong></td><td>${safe.packageName}</td></tr><tr><td><strong>Tables</strong></td><td>${safe.games}</td></tr><tr><td><strong>Date</strong></td><td>${safe.eventDate}</td></tr><tr><td><strong>Venue</strong></td><td>${safe.venue}</td></tr><tr><td><strong>Guests</strong></td><td>${safe.guestCount}</td></tr><tr><td><strong>Collection or delivery</strong></td><td>${safe.fulfilment}</td></tr><tr><td><strong>Notes</strong></td><td>${safe.notes}</td></tr></table>`;

  const customerText = `Hi ${data.name},\n\nThanks for your Iocus Casino enquiry. We have received your details for ${data.eventDate} and will be in touch to confirm availability and provide a quote.\n\nThere is no payment or booking commitment at this stage.\n\nIocus Casino`;
  const customerHtml = `<p>Hi ${safe.name},</p><p>Thanks for your Iocus Casino enquiry. We have received your details for <strong>${safe.eventDate}</strong> and will be in touch to confirm availability and provide a quote.</p><p>There is no payment or booking commitment at this stage.</p><p>Iocus Casino</p>`;

  const results = await Promise.allSettled([
    sendEmail(apiKey, { from, to: [ownerEmail], reply_to: data.email, subject: `New Iocus Casino enquiry — ${data.name}, ${data.eventDate}`, html: ownerHtml, text: ownerText }, `iocus-owner-${enquiryId}`),
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

    await env.DB.prepare(createTableSql).run();
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
