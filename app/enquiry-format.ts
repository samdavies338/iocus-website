export function formatEventDate(value: string) {
  return value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3-$2-$1");
}

const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });
const ordinalSuffixes: Partial<Record<number, string>> = { 1: "st", 2: "nd", 3: "rd" };

export function formatLongEventDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    return formatEventDate(value);
  }
  const day = date.getUTCDate();
  const suffix = day >= 11 && day <= 13 ? "th" : ordinalSuffixes[day % 10] ?? "th";
  return `${day}${suffix} ${monthName.format(date)} ${date.getUTCFullYear()}`;
}

export function isUpcomingEvent(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone: "Europe/London" }).format(new Date());
}

export function readGames(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Earlier imports can contain a comma-separated list.
  }
  return value.split(",").map((game) => game.trim()).filter(Boolean);
}
