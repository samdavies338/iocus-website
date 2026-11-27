import { isUpcomingEvent } from "./enquiry-format";

export const reminderGames = ["Blackjack", "Poker", "Roulette"] as const;

export type ReminderDetails = {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  venue: string;
  guestCount: number;
  packageName: string;
  games: string[];
  handover: "collection" | "delivery";
  arrangements: string;
};

export type ReminderMessage = {
  to: string;
  eventDate: string;
  subject: string;
  text: string;
  html: string;
};

export function parseReminderDetails(input: unknown): ReminderDetails | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const field = (key: string, limit: number) =>
    typeof raw[key] === "string" && raw[key].length <= limit ? raw[key].trim() : null;
  const name = field("name", 120);
  const email = field("email", 254);
  const phone = field("phone", 40);
  const eventType = field("eventType", 120);
  const eventDate = field("eventDate", 10);
  const startTime = field("startTime", 5);
  const venue = field("venue", 250);
  const packageName = field("packageName", 120);
  const arrangements = field("arrangements", 500);
  const { guestCount, games, handover } = raw;

  if (!name || !email || !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(email) || phone === null ||
      !eventType || !eventDate || !isUpcomingEvent(eventDate) || startTime === null ||
      (startTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) ||
      !venue || packageName === null || !arrangements ||
      typeof guestCount !== "number" || !Number.isSafeInteger(guestCount) || guestCount < 1 || guestCount > 10_000 ||
      !Array.isArray(games) || games.length < 1 || games.length > reminderGames.length ||
      new Set(games).size !== games.length || games.some((game) => !reminderGames.some((allowed) => allowed === game)) ||
      (handover !== "delivery" && handover !== "collection")) return null;

  return { name, email, phone, eventType, eventDate, startTime, venue, guestCount, packageName, games, handover, arrangements };
}
