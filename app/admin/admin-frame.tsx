import type { ReactNode } from "react";
import { SignOut } from "./sign-in-controls";
import "./admin.css";

export function AdminFrame({ children, signedIn = false }: { children: ReactNode; signedIn?: boolean }) {
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="brand" href="/" aria-label="Iocus Casino home">
          <span className="chip-mark" aria-hidden="true">I</span> IOCUS CASINO
        </a>
        {signedIn && <SignOut />}
      </header>
      <div className="admin-main">{children}</div>
    </main>
  );
}
