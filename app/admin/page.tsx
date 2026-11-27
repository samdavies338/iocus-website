import type { Metadata } from "next";
import { chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { getAdminAccess } from "./access";
import { Dashboard } from "./dashboard";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiries | Iocus Casino",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const access = await getAdminAccess();

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="brand" href="/" aria-label="Iocus Casino home">
          <span className="chip-mark" aria-hidden="true">I</span> IOCUS CASINO
        </a>
        {access.status !== "signed-out" && <a href={chatGPTSignOutPath("/admin")} target="_top">Sign out</a>}
      </header>
      <div className="admin-main">
        {access.status === "allowed" ? <Dashboard /> : (
          <section className="admin-gate">
            <h1>Enquiries dashboard</h1>
            {access.status === "signed-out" ? (
              <>
                <p>Sign in with your authorised ChatGPT account to manage Iocus Casino enquiries.</p>
                <a className="admin-button admin-primary" href={chatGPTSignInPath("/admin")} target="_top">Sign in with ChatGPT</a>
              </>
            ) : <p>This account doesn’t have access. Sign out and use your authorised ChatGPT account.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
