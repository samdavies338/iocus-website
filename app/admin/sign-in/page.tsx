import type { Metadata } from "next";
import { AdminFrame } from "../admin-frame";
import { RedeemSignInLink } from "../sign-in-controls";

export const metadata: Metadata = {
  title: "Staff sign-in | Iocus Casino",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <AdminFrame><RedeemSignInLink /></AdminFrame>;
}
