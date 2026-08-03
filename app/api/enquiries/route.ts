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

export async function POST(request: Request) {
  try {
    const data = await request.json() as Record<string, unknown>;
    const required = ["eventType", "packageName", "fulfilment", "eventDate", "venue", "name", "email", "phone"];
    if (required.some((field) => typeof data[field] !== "string" || !String(data[field]).trim()) || !Array.isArray(data.games) || data.games.length === 0) {
      return Response.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    await env.DB.prepare(createTableSql).run();
    await env.DB.prepare(`INSERT INTO enquiries (created_at, event_type, package_name, fulfilment, games, event_date, start_time, venue, guest_count, notes, name, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(new Date().toISOString(), data.eventType, data.packageName, data.fulfilment, JSON.stringify(data.games), data.eventDate, "", data.venue, Number(data.guestCount) || 0, data.notes || "", data.name, data.email, data.phone)
      .run();
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save the enquiry." }, { status: 500 });
  }
}
