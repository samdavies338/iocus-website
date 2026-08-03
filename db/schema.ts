import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
