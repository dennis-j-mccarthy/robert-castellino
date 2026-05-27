import Link from "next/link";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getAllCollections } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await getAllCollections();
  return (
    <section className="admin-page">
      <h1>Gallery collections</h1>
      {!isDatabaseConfigured() && (
        <p className="admin-page__notice">
          The database is not yet connected. Showing the static placeholders
          from <code>src/data/collections.ts</code>.
        </p>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Label</th>
            <th>Photos</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {collections.map((c) => (
            <tr key={c.slug}>
              <td><code>{c.slug}</code></td>
              <td>{c.label}</td>
              <td>{c.photos.length}</td>
              <td>
                <Link href={`/gallery`} target="_blank">view ↗</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
