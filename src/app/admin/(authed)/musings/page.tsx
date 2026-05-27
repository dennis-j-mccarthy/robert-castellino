import Link from "next/link";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getAllMusings } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function AdminMusingsPage() {
  const musings = await getAllMusings();
  return (
    <section className="admin-page">
      <h1>Musings</h1>
      {!isDatabaseConfigured() && (
        <p className="admin-page__notice">
          The database is not yet connected. Showing the static placeholders
          from <code>src/data/musings.ts</code>. Once <code>DATABASE_URL</code> is
          set and the seed has run, edits will persist.
        </p>
      )}
      <p>
        {musings.length} {musings.length === 1 ? "entry" : "entries"}.
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Title</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {musings.map((m) => (
            <tr key={m.id}>
              <td><code>{m.id}</code></td>
              <td>{m.cat}</td>
              <td>{m.title}</td>
              <td>{m.date}</td>
              <td>
                <Link href={`/musings/${m.id}`} target="_blank">view ↗</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
