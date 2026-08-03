import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host = headerStore.get("host") || "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "IOCUS | DIY Casino Table Hire";
  const description = "Ready-to-use blackjack, poker and roulette table packages with chips, accessories and simple hosting guides. No croupier needed.";
  return {
    metadataBase: new URL(origin), title, description,
    icons: { icon: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "IOCUS — Host the casino night yourself." }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
