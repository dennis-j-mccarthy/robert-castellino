import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import SeedButton from "./SeedButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await getSession();

  let dbCounts: { musings: number; collections: number; photos: number } | null = null;
  let dbError = false;

  if (isDatabaseConfigured()) {
    try {
      const [musings, collections, photos] = await Promise.all([
        prisma.musing.count(),
        prisma.collection.count(),
        prisma.photo.count(),
      ]);
      dbCounts = { musings, collections, photos };
    } catch {
      dbError = true;
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

      {isDatabaseConfigured() && (
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--rule)" }}>
          <h2 style={{ fontSize: "13px", fontFamily: "var(--mono)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--bone-70)", marginBottom: "10px" }}>
            Database
          </h2>
          {dbError ? (
            <p style={{ fontSize: "14px", color: "#e07070", marginBottom: "16px" }}>
              Could not reach the database — check connection.
            </p>
          ) : dbCounts ? (
            <p style={{ fontSize: "14px", color: "var(--bone-70)", marginBottom: "16px" }}>
              {dbCounts.musings} musings · {dbCounts.collections} collections · {dbCounts.photos} photos
            </p>
          ) : null}
          <SeedButton />
        </div>
      )}
    </section>
  );
}
