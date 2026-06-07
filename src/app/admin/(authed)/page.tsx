import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import SeedButton from "./SeedButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await getSession();

  let isEmpty = false;
  if (isDatabaseConfigured()) {
    try {
      const [m, c] = await Promise.all([prisma.musing.count(), prisma.collection.count()]);
      isEmpty = m === 0 && c === 0;
    } catch {
      // DB unreachable — don't show seed button
    }
  }

  return (
    <section className="admin-page">
      <h1>Admin</h1>
      {session && <p className="admin-page__sig">Signed in as {session.email}</p>}
      <p>
        Welcome. This is the working dashboard for the Robert Castellino site.
        Use the links above to manage musings, gallery collections, and contact
        submissions.
      </p>
      <ul className="admin-page__links">
        <li><Link href="/admin/musings">Manage musings</Link></li>
        <li><Link href="/admin/collections">Manage gallery collections</Link></li>
        <li><Link href="/admin/contact">Read contact submissions</Link></li>
      </ul>
      {isEmpty && <SeedButton />}
    </section>
  );
}
