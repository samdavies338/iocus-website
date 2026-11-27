export function formatEventDate(value: string) {
  return value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3-$2-$1");
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
