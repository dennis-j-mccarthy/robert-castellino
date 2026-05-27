import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Robert Castellino",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-shell__nav">
        <Link href="/admin" className="admin-shell__brand">
          Admin
        </Link>
        <nav className="admin-shell__menu">
          <Link href="/admin/musings">Musings</Link>
          <Link href="/admin/collections">Collections</Link>
          <Link href="/admin/contact">Contact</Link>
          <form action="/api/admin/logout" method="post" className="admin-shell__logout-form">
            <button type="submit" className="admin-shell__logout">Sign out</button>
          </form>
        </nav>
      </header>
      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
