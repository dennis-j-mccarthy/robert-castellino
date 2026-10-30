import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureCreatorSeeded } from "@/lib/creator/seed";
import CreatorNav from "./CreatorNav";

export const metadata: Metadata = {
  title: "Creator — Robert Castellino",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The Creator page shell. Gated by the SAME admin session as /admin
// (src/middleware.ts bounces logged-out visits to /admin/login?next=…; this
// is the server-side belt to that suspender). First visit seeds the brand
// essence, pillars, tone and library tags if the tables are still empty.
export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=/creator");
  await ensureCreatorSeeded();

  return (
    <div className="admin-shell cr-shell">
      <header className="admin-shell__nav">
        <Link href="/creator" className="admin-shell__brand">
          Creator
        </Link>
        <nav className="admin-shell__menu cr-menu">
          <CreatorNav />
          <Link href="/admin" className="cr-menu__back">
            ← Admin
          </Link>
          <form action="/api/admin/logout" method="post" className="admin-shell__logout-form">
            <button type="submit" className="admin-shell__logout">Sign out</button>
          </form>
        </nav>
      </header>
      <main className="admin-shell__main cr-main">{children}</main>
    </div>
  );
}
