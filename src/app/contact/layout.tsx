import type { Metadata } from "next";

// The contact page is a client component, so its metadata lives here.
export const metadata: Metadata = { alternates: { canonical: "/contact" } };

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
