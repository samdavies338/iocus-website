import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { ReminderMessage } from "../app/reminder-details";

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
  packagePricePence: integer("package_price_pence"),
  deliveryFeePence: integer("delivery_fee_pence"),
  bookingTemplateVersion: integer("booking_template_version"),
}, (table) => [
  check("enquiry_decision_status", sql`${table.status} IN ('booked', 'rejected')`),
]);

export const enquiryReminders = sqliteTable("enquiry_reminders", {
  enquiryId: integer("enquiry_id").primaryKey().references(() => enquiryDecisions.enquiryId),
  delivery: text("delivery").notNull(),
  collection: text("collection").notNull(),
  message: text("message", { mode: "json" }).$type<ReminderMessage>(),
  firstAttemptAt: text("first_attempt_at"),
  lastAttemptAt: text("last_attempt_at"),
  emailSentAt: text("email_sent_at"),
  emailFailedAt: text("email_failed_at"),
});

export const adminLoginLinks = sqliteTable("admin_login_links", {
  email: text("email").primaryKey(),
  tokenHash: text("token_hash").unique(),
  expiresAt: integer("expires_at").notNull(),
  requestedAt: integer("requested_at").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  requestsInWindow: integer("requests_in_window").notNull(),
});

export const adminSessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("admin_session_email_expiry").on(table.email, table.expiresAt),
]);
