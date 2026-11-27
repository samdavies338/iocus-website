import { and, eq, gt, lte, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../../../db";
import { adminLoginLinks, adminSessions } from "../../../../db/schema";
import {
  adminCookie, hashAdminToken, isAdminToken, isAllowedAdmin, newAdminToken, sessionLifetime,
} from "../../../admin/access";
import { getEnquiryMailConfig, sendEmail } from "../../../enquiry-mail";

export const dynamic = "force-dynamic";

const LINK_LIFETIME_MS = 15 * 60_000;
const REQUEST_COOLDOWN_MS = 60_000;
const REQUEST_WINDOW_MS = 60 * 60_000;
const REQUEST_WINDOW_LIMIT = 5;

function sessionCookie(value: string, maxAge: number) {
  return `${adminCookie}=${value}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

async function emailSignInLink(email: string) {
  if (!isAllowedAdmin(email)) return;

  const { apiKey, from } = getEnquiryMailConfig();
  if (!apiKey || !from) return;

  const now = Date.now();
  const oldestInWindow = now - REQUEST_WINDOW_MS;
  const token = newAdminToken();
  const tokenHash = await hashAdminToken(token);
  const db = getDb();
  const links = adminLoginLinks;
  const expiresAt = now + LINK_LIFETIME_MS;

  const [issued] = await db.insert(links).values({
    email, tokenHash, expiresAt, requestedAt: now, windowStartedAt: now, requestsInWindow: 1,
  }).onConflictDoUpdate({
    target: links.email,
    set: {
      tokenHash, expiresAt, requestedAt: now,
      windowStartedAt: sql`case when ${links.windowStartedAt} <= ${oldestInWindow} then ${now} else ${links.windowStartedAt} end`,
      requestsInWindow: sql`case when ${links.windowStartedAt} <= ${oldestInWindow} then 1 else ${links.requestsInWindow} + 1 end`,
    },
    setWhere: and(
      lte(links.requestedAt, now - REQUEST_COOLDOWN_MS),
      or(lte(links.windowStartedAt, oldestInWindow), lte(links.requestsInWindow, REQUEST_WINDOW_LIMIT - 1)),
    ),
  }).returning({ email: links.email });
  if (!issued) return;

  // The fragment stays out of navigation requests and server access logs.
  const url = `https://iocuscasino.com/admin/sign-in#${token}`;
  await sendEmail(apiKey, {
    from,
    to: [email],
    subject: "Your Iocus Casino dashboard sign-in link",
    text: `Use this link to sign in to the Iocus Casino enquiries dashboard:\n\n${url}\n\nThe link expires in 15 minutes and can be used once. If you didn’t request it, you can ignore this email.`,
    html: `<div style="background:#f4eee4;color:#1b1025;padding:24px;font:16px/1.55 Arial,sans-serif">
      <div style="max-width:540px;margin:auto;background:#fffdf8">
        <div style="background:#1b1025;color:#d4aa42;padding:18px 24px;font-weight:bold;letter-spacing:2px">IOCUS CASINO</div>
        <div style="padding:24px">
          <h1 style="font-size:24px;margin:0 0 12px">Sign in to your dashboard</h1>
          <p>Use the link below to open your Iocus Casino enquiries.</p>
          <p><a href="${url}" style="display:inline-block;background:#1b1025;color:#fffdf8;padding:12px 18px;border-radius:4px;text-decoration:none;font-weight:bold">Open the enquiries dashboard</a></p>
          <p>The link expires in 15 minutes and can be used once. If you didn’t request it, you can ignore this email.</p>
        </div>
      </div>
    </div>`,
  }, `iocus-admin-link-${tokenHash}`);
}

async function redeemSignInLink(token: string) {
  const now = Date.now();
  const db = getDb();
  const links = adminLoginLinks;
  const hash = await hashAdminToken(token);
  const [claimed] = await db.update(links).set({ tokenHash: null })
    .where(and(eq(links.tokenHash, hash), gt(links.expiresAt, now)))
    .returning({ email: links.email });
  if (!claimed || !isAllowedAdmin(claimed.email)) return null;

  const session = newAdminToken();
  const sessions = adminSessions;
  await db.batch([
    db.delete(sessions).where(and(eq(sessions.email, claimed.email), lte(sessions.expiresAt, now))),
    db.insert(sessions).values({
      tokenHash: await hashAdminToken(session),
      email: claimed.email,
      expiresAt: now + sessionLifetime * 1000,
    }),
  ]);
  return session;
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Open the Iocus Casino dashboard directly to sign in." }, { status: 403 });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Expected a JSON request." }, { status: 415 });
  }
  const body = await request.json().catch(() => null) as { action?: unknown; email?: unknown; token?: unknown } | null;

  try {
    if (body?.action === "request") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: "Enter a valid email address." }, { status: 400 });
      }
      // Keep the response identical for unknown addresses and rate-limited requests.
      await emailSignInLink(email).catch(() => console.warn("Unable to send a dashboard sign-in link."));
      return Response.json({ ok: true }, { status: 202 });
    }
    if (body?.action === "redeem") {
      const session = isAdminToken(body.token) ? await redeemSignInLink(body.token) : null;
      if (!session) return Response.json({ error: "This sign-in link has expired or has already been used. Please request a new one." }, { status: 400 });
      return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(session, sessionLifetime) } });
    }
    if (body?.action === "logout") {
      const token = (await cookies()).get(adminCookie)?.value;
      if (isAdminToken(token)) await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, await hashAdminToken(token)));
      return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie("", 0) } });
    }
    return Response.json({ error: "Choose a sign-in action." }, { status: 400 });
  } catch {
    return Response.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
