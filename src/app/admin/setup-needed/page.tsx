import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin setup needed — Robert Castellino",
  robots: { index: false, follow: false },
};

export default function SetupNeededPage() {
  return (
    <section className="admin-login">
      <h1>Admin not yet configured</h1>
      <p>
        The admin area is wired but not yet turned on. Before signing in, the
        following environment variables must be set on the deployment:
      </p>
      <ul>
        <li><code>ADMIN_EMAIL</code></li>
        <li><code>ADMIN_PASSWORD_HASH</code> (bcrypt hash of the password)</li>
        <li><code>ADMIN_JWT_SECRET</code> (random 32+ char string)</li>
        <li><code>DATABASE_URL</code> (Postgres connection string)</li>
      </ul>
      <p>
        See <code>.env.example</code> at the project root for full setup notes.
      </p>
    </section>
  );
}
