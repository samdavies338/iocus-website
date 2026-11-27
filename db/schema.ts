import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const enquiries = sqliteTable("enquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull(),
  eventType: text("event_type").notNull(),
  packageName: text("package_name"),
  fulfilment: text("fulfilment"),
  games: text("games").notNull(),
  eventDate: text("event_date").notNull(),
  startTime: text("start_time").notNull(),
  venue: text("venue").notNull(),
  guestCount: integer("guest_count").notNull(),
  notes: text("notes"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
});

export const enquiryDecisions = sqliteTable("enquiry_decisions", {
  enquiryId: integer("enquiry_id").primaryKey().references(() => enquiries.id),
  status: text("status", { enum: ["booked", "rejected"] }).notNull(),
  decidedAt: text("decided_at").notNull(),
  decidedBy: text("decided_by").notNull(),
  customerNote: text("customer_note").notNull(),
  firstAttemptAt: text("first_attempt_at"),
  lastAttemptAt: text("last_attempt_at"),
  emailSentAt: text("email_sent_at"),
  emailFailedAt: text("email_failed_at"),
}, (table) => [
  check("enquiry_decision_status", sql`${table.status} IN ('booked', 'rejected')`),
]);
