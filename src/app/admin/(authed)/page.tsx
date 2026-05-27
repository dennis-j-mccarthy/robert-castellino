import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function AdminHome() {
  const session = await getSession();
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
    </section>
  );
}
