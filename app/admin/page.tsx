import type { Metadata } from "next";
import { getAdminAccess } from "./access";
import { AdminFrame } from "./admin-frame";
import { Dashboard } from "./dashboard";
import { RequestSignInLink } from "./sign-in-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiries | Iocus Casino",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const access = await getAdminAccess();

  return (
    <AdminFrame signedIn={access.status === "allowed"}>
      {access.status === "allowed" ? <Dashboard /> : <RequestSignInLink />}
    </AdminFrame>
  );
}
