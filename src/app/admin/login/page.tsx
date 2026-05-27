"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams(window.location.search).get("next") || "/admin";
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(fd.get("email") ?? ""),
          password: String(fd.get("password") ?? ""),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Sign-in failed.");
        return;
      }
      window.location.assign(next);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-login">
      <h1>Admin sign-in</h1>
      <form className="admin-login__form" onSubmit={onSubmit} noValidate>
        <label className="contact__field">
          <span className="contact__label">Email</span>
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label className="contact__field">
          <span className="contact__label">Password</span>
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        {error && <p className="contact__error" role="alert">{error}</p>}
        <button
          type="submit"
          className="btn btn--gold btn--lg"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
