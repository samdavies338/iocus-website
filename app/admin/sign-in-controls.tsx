"use client";

import { useEffect, useState } from "react";

async function sessionAction(data: { action: "request"; email: string } | { action: "redeem"; token: string } | { action: "logout" }) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
}

export function RequestSignInLink() {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  return (
    <section className="admin-gate">
      <h1>Enquiries dashboard</h1>
      {submitted ? (
        <>
          <p role="status">If your email has dashboard access, we’ll send you a sign-in link. Please check your inbox and spam folder.</p>
          <button type="button" className="admin-button" onClick={() => setSubmitted(false)}>Use another email or try again</button>
        </>
      ) : (
        <>
          <p>Enter your email and we’ll send you a one-time sign-in link.</p>
          <form className="admin-sign-in-form" onSubmit={async (event) => {
            event.preventDefault();
            if (sending) return;
            const email = String(new FormData(event.currentTarget).get("email") ?? "");
            setSending(true);
            setError("");
            try {
              await sessionAction({ action: "request", email });
              setSubmitted(true);
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : "Could not request a link.");
            } finally {
              setSending(false);
            }
          }}>
            <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
            <button className="admin-button admin-primary" disabled={sending}>{sending ? "Requesting link…" : "Email me a sign-in link"}</button>
          </form>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}

export function RedeemSignInLink() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (/^[a-f0-9]{64}$/.test(fragment)) setToken(fragment);
    if (fragment) window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, []);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      await sessionAction({ action: "redeem", token });
      window.location.replace("/admin");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <section className="admin-gate">
      <h1>Sign in to Iocus Casino</h1>
      {!ready ? <p>Opening your sign-in link…</p> : token ? (
        <>
          <p>Continue to open the private enquiries dashboard.</p>
          <button type="button" className="admin-button admin-primary" onClick={() => void signIn()} disabled={busy}>
            {busy ? "Signing in…" : "Continue to dashboard"}
          </button>
          {error && <><p role="alert">{error}</p><a className="admin-button" href="/admin">Request a new link</a></>}
        </>
      ) : (
        <>
          <p>This sign-in link is incomplete. Request a fresh link from the dashboard.</p>
          <a className="admin-button admin-primary" href="/admin">Request a new link</a>
        </>
      )}
    </section>
  );
}

export function SignOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="admin-sign-out">
      <button type="button" className="admin-button" disabled={busy} onClick={async () => {
        setBusy(true);
        setError(false);
        try {
          await sessionAction({ action: "logout" });
          window.location.replace("/admin");
        } catch {
          setError(true);
          setBusy(false);
        }
      }}>{busy ? "Signing out…" : "Sign out"}</button>
      {error && <p role="alert">Could not sign out. Try again.</p>}
    </div>
  );
}
