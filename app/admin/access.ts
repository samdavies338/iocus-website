import { env } from "cloudflare:workers";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../db";
import { adminSessions } from "../../db/schema";

export const adminCookie = "__Host-iocus-admin";
export const sessionLifetime = 7 * 24 * 60 * 60; // seconds

export function isAllowedAdmin(email: string) {
  const { ENQUIRY_ADMIN_EMAILS } = env as { ENQUIRY_ADMIN_EMAILS?: string };
  return Boolean(email) && (ENQUIRY_ADMIN_EMAILS ?? "").split(",")
    .some((entry) => entry.trim().toLowerCase() === email);
}

export const isAdminToken = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function newAdminToken() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashAdminToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return hex(new Uint8Array(digest));
}

export async function getAdminAccess() {
  const token = (await cookies()).get(adminCookie)?.value;
  if (!isAdminToken(token)) return { status: "signed-out" } as const;

  const [session] = await getDb().select({ email: adminSessions.email }).from(adminSessions).where(and(
    eq(adminSessions.tokenHash, await hashAdminToken(token)),
    gt(adminSessions.expiresAt, Date.now()),
  ));
  if (!session || !isAllowedAdmin(session.email)) return { status: "signed-out" } as const;

  return { status: "allowed", user: { email: session.email } } as const;
}
