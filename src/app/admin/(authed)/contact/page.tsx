import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  if (!isDatabaseConfigured()) {
    return (
      <section className="admin-page">
        <h1>Contact submissions</h1>
        <p className="admin-page__notice">
          The database is not yet connected. Submissions will appear here once
          <code>DATABASE_URL</code> is set on the deployment.
        </p>
      </section>
    );
  }

  const submissions = await prisma.contactSubmission.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section className="admin-page">
      <h1>Contact submissions</h1>
      <p>
        {submissions.length}{" "}
        {submissions.length === 1 ? "message" : "messages"} (most recent first,
        non-archived).
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Name</th>
            <th>Email</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>{s.createdAt.toISOString().slice(0, 10)}</td>
              <td>
                {s.firstName} {s.lastName}
              </td>
              <td>
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </td>
              <td className="admin-table__message">{s.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
